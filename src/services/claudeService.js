const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

export const getClaudeResponse = async (userMessage) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides brief and informative descriptions of locations."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userMessage
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching response from Claude:', error);
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      }
    }
    if (!error.response) {
      throw new Error('No response received from server. Please try again.');
    }
    const errorBody = await error.response.text();
    console.error('Error response body:', errorBody);
    throw new Error(`Server error: ${error.response.status} - ${errorBody || 'Unknown server error'}`);
  }
};
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

export const getClaudeResponse = async (userMessage) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides brief and informative descriptions of locations."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userMessage
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching response from Claude:', error);
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      }
    }
    if (error.response) {
      const errorBody = await error.response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`Server error: ${error.response.status} - ${errorBody || 'Unknown server error'}`);
    } else if (error.request) {
      throw new Error('No response received from server. Please try again.');
    }
    throw error;
  }
};
