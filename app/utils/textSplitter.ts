/**
 * Text splitting utilities for social media platforms
 * Handles splitting long text into multiple posts while respecting character limits
 */

export interface SplitOptions {
  maxLength: number;
  addThreadNumbers?: boolean;
  preserveParagraphs?: boolean;
  splitOnSentences?: boolean;
}

/**
 * Split text into chunks that fit within character limit
 * Tries to split on natural boundaries (paragraphs, sentences) when possible
 */
export function splitText(
  text: string,
  options: SplitOptions = { maxLength: 280 }
): string[] {
  const {
    maxLength,
    addThreadNumbers = true,
    preserveParagraphs = true,
    splitOnSentences = true,
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  // If text fits in one chunk, return it
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remainingText = text;

  // Split on paragraphs first if requested
  if (preserveParagraphs) {
    const paragraphs = remainingText.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      // If adding this paragraph would exceed limit, save current chunk and start new one
      if (currentChunk && currentChunk.length + trimmedParagraph.length + 2 > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedParagraph;
      } else if (currentChunk) {
        currentChunk += "\n\n" + trimmedParagraph;
      } else {
        currentChunk = trimmedParagraph;
      }

      // If current chunk itself is too long, split it further
      if (currentChunk.length > maxLength) {
        const splitParagraph = splitLongText(currentChunk, maxLength, splitOnSentences);
        chunks.push(...splitParagraph.slice(0, -1));
        currentChunk = splitParagraph[splitParagraph.length - 1];
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Simple split without paragraph preservation
    chunks.push(...splitLongText(remainingText, maxLength, splitOnSentences));
  }

  // Add thread numbers if requested
  if (addThreadNumbers && chunks.length > 1) {
    return chunks.map((chunk, index) => {
      const threadIndicator = `${index + 1}/${chunks.length}\n\n`;
      // Ensure we don't exceed maxLength with thread indicator
      const availableLength = maxLength - threadIndicator.length;
      if (chunk.length > availableLength) {
        return threadIndicator + chunk.substring(0, availableLength - 3) + "...";
      }
      return threadIndicator + chunk;
    });
  }

  return chunks;
}

/**
 * Split long text into chunks, preferring sentence boundaries
 */
function splitLongText(
  text: string,
  maxLength: number,
  splitOnSentences: boolean
): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];

  if (splitOnSentences) {
    // Split on sentence boundaries (.!?)
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // If adding this sentence would exceed limit
      if (currentChunk && currentChunk.length + trimmedSentence.length + 1 > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else if (currentChunk) {
        currentChunk += " " + trimmedSentence;
      } else {
        currentChunk = trimmedSentence;
      }

      // If current sentence itself is too long, force split it
      if (currentChunk.length > maxLength) {
        const forceSplit = forceSplitText(currentChunk, maxLength);
        chunks.push(...forceSplit.slice(0, -1));
        currentChunk = forceSplit[forceSplit.length - 1];
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    chunks.push(...forceSplitText(text, maxLength));
  }

  return chunks;
}

/**
 * Force split text at maxLength boundaries (last resort)
 * Tries to split on word boundaries when possible
 */
function forceSplitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining.trim());
      break;
    }

    // Try to find a space near the maxLength boundary
    let splitPoint = maxLength;
    const searchStart = Math.max(0, maxLength - 50); // Look back up to 50 chars
    const substring = remaining.substring(searchStart, maxLength + 1);
    const lastSpace = substring.lastIndexOf(" ");

    if (lastSpace !== -1) {
      splitPoint = searchStart + lastSpace;
    }

    chunks.push(remaining.substring(0, splitPoint).trim());
    remaining = remaining.substring(splitPoint).trim();
  }

  return chunks;
}

/**
 * Split an array of messages into tweet-sized chunks
 * Each message is treated as a unit and won't be split across tweets
 */
export function splitMessages(
  messages: Array<{ role: string; content: string }>,
  maxLength: number = 280
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  for (const message of messages) {
    const messageText = `${message.role === "user" ? "👤" : "🤖"} ${message.content}`;
    const separator = currentChunk ? "\n\n---\n\n" : "";
    const combined = currentChunk + separator + messageText;

    if (combined.length <= maxLength) {
      currentChunk = combined;
    } else {
      // Current chunk is full, save it and start new chunk
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If single message is too long, split it
      if (messageText.length > maxLength) {
        const splitMessage = splitText(messageText, {
          maxLength,
          addThreadNumbers: false,
          preserveParagraphs: true,
          splitOnSentences: true,
        });
        chunks.push(...splitMessage.slice(0, -1));
        currentChunk = splitMessage[splitMessage.length - 1];
      } else {
        currentChunk = messageText;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Count characters in text, accounting for URLs (which count as 23 chars on Twitter)
 */
export function countTwitterCharacters(text: string): number {
  // Twitter counts URLs as 23 characters regardless of actual length
  const urlRegex = /https?:\/\/[^\s]+/g;
  let count = text.length;

  const urls = text.match(urlRegex);
  if (urls) {
    for (const url of urls) {
      count = count - url.length + 23;
    }
  }

  return count;
}

/**
 * Validate if text fits within Twitter's character limit
 */
export function isValidTweetLength(text: string, maxLength: number = 280): boolean {
  return countTwitterCharacters(text) <= maxLength;
}
