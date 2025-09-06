// Chart tool definitions based on CHART_API_REFERENCE.md
export const chartTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'set_symbol',
                description: 'Change the trading pair symbol on the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        symbol: {
                            type: 'string',
                            description: 'Trading pair symbol (e.g., BTC-USD, ETH-USD)'
                        }
                    },
                    required: ['symbol']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'set_granularity',
                description: 'Change the chart timeframe/granularity',
                parameters: {
                    type: 'object',
                    properties: {
                        granularity: {
                            type: 'string',
                            enum: ['ONE_MINUTE', 'FIVE_MINUTE', 'FIFTEEN_MINUTE', 'THIRTY_MINUTE',
                                'ONE_HOUR', 'TWO_HOUR', 'SIX_HOUR', 'ONE_DAY'],
                            description: 'Chart timeframe'
                        }
                    },
                    required: ['granularity']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_candles',
                description: 'Fetch OHLC candle data for analysis',
                parameters: {
                    type: 'object',
                    properties: {
                        symbol: {
                            type: 'string',
                            description: 'Trading pair symbol'
                        },
                        granularity: {
                            type: 'string',
                            description: 'Timeframe for candles'
                        },
                        limit: {
                            type: 'number',
                            description: 'Number of candles to fetch',
                            default: 100
                        }
                    },
                    required: ['symbol', 'granularity']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'show_indicator',
                description: 'Display a technical indicator on the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            enum: ['volume', 'rsi', 'macd', 'bollinger-bands', 'moving-averages', 'atr', 'stochastic'],
                            description: 'Indicator identifier'
                        },
                        name: {
                            type: 'string',
                            description: 'Display name for the indicator'
                        },
                        params: {
                            type: 'object',
                            description: 'Indicator-specific parameters (e.g., period for RSI)'
                        }
                    },
                    required: ['id', 'name']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'hide_indicator',
                description: 'Hide a technical indicator from the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            enum: ['volume', 'rsi', 'macd', 'bollinger-bands', 'moving-averages', 'atr', 'stochastic'],
                            description: 'Indicator identifier to hide (must match a currently shown indicator)'
                        }
                    },
                    required: ['id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'add_trend_line',
                description: 'Draw a trend line on the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        start: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'number', description: 'Start point timestamp in milliseconds' },
                                price: { type: 'number', description: 'Start point price' }
                            },
                            required: ['timestamp', 'price']
                        },
                        end: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'number', description: 'End point timestamp in milliseconds' },
                                price: { type: 'number', description: 'End point price' }
                            },
                            required: ['timestamp', 'price']
                        },
                        color: {
                            type: 'string',
                            description: 'Line color in hex format',
                            default: '#2962ff'
                        },
                        lineWidth: {
                            type: 'number',
                            description: 'Line width in pixels',
                            default: 2
                        },
                        style: {
                            type: 'string',
                            enum: ['solid', 'dashed', 'dotted'],
                            default: 'solid'
                        },
                        extendLeft: {
                            type: 'boolean',
                            description: 'Extend line to the left',
                            default: false
                        },
                        extendRight: {
                            type: 'boolean',
                            description: 'Extend line to the right',
                            default: false
                        }
                    },
                    required: ['start', 'end']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'remove_trend_line',
                description: 'Remove a trend line from the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Trend line ID to remove'
                        }
                    },
                    required: ['id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'clear_trend_lines',
                description: 'Remove all trend lines from the chart',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'set_time_range',
                description: 'Adjust the visible time range on the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        start: {
                            type: 'number',
                            description: 'Start timestamp in milliseconds'
                        },
                        end: {
                            type: 'number',
                            description: 'End timestamp in milliseconds'
                        }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'set_price_range',
                description: 'Adjust the visible price range on the chart',
                parameters: {
                    type: 'object',
                    properties: {
                        min: {
                            type: 'number',
                            description: 'Minimum price to display'
                        },
                        max: {
                            type: 'number',
                            description: 'Maximum price to display'
                        }
                    },
                    required: ['min', 'max']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'enter_fullscreen',
                description: 'Enter fullscreen mode',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'exit_fullscreen',
                description: 'Exit fullscreen mode',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_chart_state',
                description: 'Get the current chart configuration and state',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'activate_trend_line_tool',
                description: 'Activate the trend line drawing tool for manual drawing',
                parameters: {
                    type: 'object',
                    properties: {
                        color: {
                            type: 'string',
                            description: 'Default line color',
                            default: '#2962ff'
                        },
                        lineWidth: {
                            type: 'number',
                            description: 'Default line width',
                            default: 2
                        },
                        style: {
                            type: 'string',
                            enum: ['solid', 'dashed', 'dotted'],
                            default: 'solid'
                        }
                    }
                }
            }
        }
    ],
    isChartTool(name) {
        return this.definitions.some(def => def.function.name === name);
    },
    getConfirmationMessage(toolName, args) {
        switch (toolName) {
            case 'set_symbol':
                return `✓ Changed symbol to ${args.symbol}`;
            case 'set_granularity':
                return `✓ Set timeframe to ${args.granularity.toLowerCase().replace('_', ' ')}`;
            case 'show_indicator':
                return `✓ Added ${args.name} indicator`;
            case 'hide_indicator':
                return `✓ Removed ${args.id.replace(/-/g, ' ')} indicator`;
            case 'add_trend_line':
                return `✓ Drew trend line`;
            case 'remove_trend_line':
                return `✓ Removed trend line`;
            case 'clear_trend_lines':
                return `✓ Cleared all trend lines`;
            case 'set_time_range':
                return `✓ Adjusted time range`;
            case 'set_price_range':
                return `✓ Adjusted price range`;
            case 'enter_fullscreen':
                return `✓ Entered fullscreen mode`;
            case 'exit_fullscreen':
                return `✓ Exited fullscreen mode`;
            case 'get_chart_state':
                return `✓ Retrieved chart state`;
            case 'activate_trend_line_tool':
                return `✓ Trend line tool activated`;
            case 'get_candles':
                return `✓ Fetched candle data`;
            default:
                return `✓ Executed ${toolName}`;
        }
    }
};
//# sourceMappingURL=chart-tools.js.map