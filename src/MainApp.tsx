import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './components/pages/HomePage';
import { ChatPage } from './components/pages/ChatPage';
import { JournalPage } from './components/pages/JournalPage';
import { GardenPage } from './components/pages/GardenPage';
import { FeedPage } from './components/pages/FeedPage';
import { ToolkitPage } from './components/pages/ToolkitPage';
import { useTheme } from './components/ui/ThemeProvider';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { theme } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'chat':
        return <ChatPage onPageChange={setCurrentPage} />;
      case 'journal':
        return <JournalPage />;
      case 'garden':
        return <GardenPage />;
      case 'feed':
        return <FeedPage />;
      case 'toolkit':
        return <ToolkitPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: theme.background }}>
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-grow">
        {renderPage()}
      </main>
    </div>
  );
};

export default MainApp;