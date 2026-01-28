/**
 * commandDispatcher.js
 * Handles execution of structured commands returned by the LLM.
 */

const executeCommand = async (action, payload) => {
  console.log(`[CommandDispatcher] Executing action: ${action}`, payload);

  switch (action) {
    case 'getWeather':
      // Mock weather data
      return {
        result: `The weather in ${payload.location || 'your area'} is sunny and 25 degrees Celsius.`
      };
    
    case 'getTime':
      const now = new Date();
      return {
        result: `The current time is ${now.toLocaleTimeString()}.`
      };

    case 'searchWeb':
      return {
        result: `I found some results for ${payload.query}. (Web search simulation)`
      };

    case 'none':
    default:
      return null;
  }
};

module.exports = { executeCommand };
