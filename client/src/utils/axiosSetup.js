// Axios configuration for web mode only
import axios from 'axios';

// Setup axios interceptor for web mode
export const setupAxios = () => {
  console.log('🚀 setupAxios() called!');
  console.log('🌐 Web mode - using cloud API');
  
  // No interceptors needed - direct API calls to cloud
};

export default setupAxios;