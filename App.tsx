import React from 'react';
import { AIProvider } from './context/AIContext';
import { AIChatInterface } from './components/AIChatInterface';

function App() {
  return (
    <AIProvider>
      <AIChatInterface 
        chatTitle="Hyper-Cognitive AI Nexus"
        initialTheme="dark"
        enableMultiModalInput={true}
        enableAgentDelegation={true}
      />
    </AIProvider>
  );
}

export default App;