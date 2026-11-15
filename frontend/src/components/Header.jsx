import React, { useState, useEffect } from 'react';
import { RefreshCw, Database } from 'lucide-react';

const Header = ({ onRefresh }) => {
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const handleRefreshClick = () => {
    setLastRefreshed(new Date());
    onRefresh();
  };

  return (
    <header className="dashboard-header">
      <div className="header-title">
        <h1><Database className="title-icon" /> Weather & Climate Real-Time Big Data Analytics</h1>
        <p className="pipeline-desc">Data Pipeline: Kafka &rarr; Spark &rarr; HDFS &rarr; Hive/MapReduce &rarr; Flask &rarr; React</p>
      </div>
      <div className="header-actions">
        <span className="last-refresh">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </span>
        <button className="refresh-btn" onClick={handleRefreshClick}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
    </header>
  );
};

export default Header;
