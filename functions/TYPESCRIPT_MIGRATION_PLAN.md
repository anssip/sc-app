# TypeScript Implementation Plan for MCP Server with Workflow Framework

## Overview
Convert the MCP server and all related modules to TypeScript, and implement a workflow framework for handling complex mathematical operations like finding collinear points for trend lines.

## Phase 1: TypeScript Setup for Functions Directory

### 1.1 Create TypeScript Configuration
- Create `functions/tsconfig.json` for Firebase Functions
- Configure for ES modules and Node.js environment
- Set up proper type checking and module resolution

### 1.2 Install Dependencies
- Install TypeScript and type definitions using Bun
- Add necessary @types packages for Firebase, Express, OpenAI
- Update build scripts in `functions/package.json`

## Phase 2: Convert Existing Files to TypeScript

### 2.1 File Conversions
- `mcp-server.js` → `mcp-server.ts`
- `lib/openai-service.js` → `lib/openai-service.ts`
- `lib/firestore-tools.js` → `lib/firestore-tools.ts`
- `lib/chart-tools.js` → `lib/chart-tools.ts`

### 2.2 Type Definitions
- Create proper interfaces for all data structures
- Add type safety to API responses
- Define chart context and tool call interfaces

## Phase 3: Implement Workflow Framework

### 3.1 Core Framework Structure
```
functions/lib/workflows/
├── types.ts                    # Core workflow interfaces and types
├── WorkflowEngine.ts           # Main workflow orchestration engine
├── TrendLineWorkflow.ts        # RANSAC-based trend line finding
├── PatternRecognitionWorkflow.ts # Chart pattern detection
├── BacktestingWorkflow.ts      # Strategy backtesting
└── index.ts                     # Workflow exports
```

### 3.2 Core Interfaces
```typescript
interface Workflow<T, R> {
  name: string;
  description: string;
  validateInput(input: T): boolean;
  execute(input: T): Promise<R>;
}

interface WorkflowContext {
  chartContext: ChartContext;
  priceData: PriceCandle[];
  userId: string;
  sessionId: string;
}

interface TrendLineResult {
  points: Array<{timestamp: number; price: number}>;
  equation: {slope: number; intercept: number};
  confidence: number;
  trendLine: TrendLineParams;
}
```

## Phase 4: TrendLineWorkflow Implementation

### 4.1 RANSAC Algorithm
- Implement RANSAC (Random Sample Consensus) for robust line fitting
- Support for finding collinear points among noisy data
- Configurable parameters:
  - Minimum points required (default: 3)
  - Inlier threshold (price deviation tolerance)
  - Maximum iterations
  - Confidence level

### 4.2 Workflow Steps
1. **Data Fetching**: Get price data for specified time range
2. **Peak/Valley Detection**: Find local highs (resistance) or lows (support)
3. **RANSAC Fitting**: Find best-fit line through points
4. **Validation**: Ensure minimum points and confidence threshold
5. **Parameter Generation**: Create chart API parameters

### 4.3 Example Usage
```typescript
const workflow = new TrendLineWorkflow();
const result = await workflow.execute({
  type: 'resistance',
  symbol: 'BTC-USD',
  interval: 'ONE_HOUR',
  timeRange: {start: startTime, end: endTime},
  minPoints: 3,
  threshold: 0.02 // 2% price deviation
});
```

## Phase 5: Integration with OpenAI Service

### 5.1 Workflow Detection
- Analyze user intent to determine if workflow is needed
- Route mathematical/deterministic tasks to workflows
- Maintain LLM for natural language understanding

### 5.2 Hybrid Approach
```typescript
// In openai-service.ts
async function processChat({message, chartContext, ...}) {
  const intent = analyzeIntent(message);
  
  if (intent.requiresWorkflow) {
    const workflow = WorkflowEngine.getWorkflow(intent.workflowType);
    const result = await workflow.execute(intent.parameters);
    
    // Convert workflow result to tool calls
    const toolCalls = convertToToolCalls(result);
    await executeToolCalls(toolCalls);
    
    // Stream confirmation to user
    onStream(`✓ ${workflow.getConfirmationMessage(result)}`);
  } else {
    // Regular LLM processing
    await processWithOpenAI(message, chartContext);
  }
}
```

## Phase 6: Additional Workflows

### 6.1 PatternRecognitionWorkflow
- Head and shoulders detection
- Triangle patterns
- Flag and pennant patterns
- Support/resistance levels

### 6.2 BacktestingWorkflow
- Strategy execution simulation
- Performance metrics calculation
- Risk analysis
- Trade signal generation

## Phase 7: Testing and Deployment

### 7.1 Unit Tests
- Test RANSAC algorithm with known data
- Verify workflow orchestration
- Test type safety

### 7.2 Integration Tests
- Test with Firebase emulator
- Verify chart API integration
- Test streaming responses

### 7.3 Build Configuration
- Update `functions/package.json`:
```json
{
  "scripts": {
    "build": "bun run tsc",
    "watch": "bun run tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "npm run build && firebase deploy --only functions"
  }
}
```

## Benefits of This Approach

1. **Type Safety**: Full TypeScript coverage prevents runtime errors
2. **Deterministic Operations**: Mathematical accuracy for trend lines
3. **Extensibility**: Easy to add new workflow types
4. **Maintainability**: Clear separation of concerns
5. **Performance**: Efficient algorithms for data processing
6. **User Experience**: Reliable and predictable results

## Implementation Timeline

- **Week 1**: TypeScript setup and file conversion
- **Week 2**: Core workflow framework implementation
- **Week 3**: TrendLineWorkflow with RANSAC
- **Week 4**: Testing and additional workflows

## Files to Create/Modify

### New Files
1. `functions/tsconfig.json`
2. `functions/lib/workflows/types.ts`
3. `functions/lib/workflows/WorkflowEngine.ts`
4. `functions/lib/workflows/TrendLineWorkflow.ts`
5. `functions/lib/workflows/PatternRecognitionWorkflow.ts`
6. `functions/lib/workflows/BacktestingWorkflow.ts`
7. `functions/lib/workflows/index.ts`

### Files to Convert
1. `functions/mcp-server.js` → `functions/mcp-server.ts`
2. `functions/lib/openai-service.js` → `functions/lib/openai-service.ts`
3. `functions/lib/firestore-tools.js` → `functions/lib/firestore-tools.ts`
4. `functions/lib/chart-tools.js` → `functions/lib/chart-tools.ts`

### Files to Update
1. `functions/package.json` (add TypeScript dependencies and scripts)
2. `functions/index.js` (update to handle TypeScript output)

## Notes

- Use Bun for package management and running TypeScript
- Maintain backward compatibility during migration
- Ensure Firebase Functions deployment works with TypeScript
- Consider using esbuild or similar for fast builds
- Keep emulator configuration working throughout migration