import React, { useState, useEffect } from 'react';
import { DATABASE_CONFIGS, getCurrentDatabaseConfig, setCurrentDatabase } from '../../config/database';

const DatabaseSelector: React.FC = () => {
  const [selected, setSelected] = useState(getCurrentDatabaseConfig().id);

  useEffect(() => {
    setCurrentDatabase(selected);
    window.location.reload(); // Recharge l'app pour appliquer le changement
  }, [selected]);

  return (
    <div style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #eee', borderRadius: 8, background: '#fafbfc' }}>
      <label htmlFor="db-select" style={{ fontWeight: 'bold', marginRight: 8 }}>Base de données :</label>
      <select
        id="db-select"
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{ padding: '0.5rem', borderRadius: 4 }}
      >
        {DATABASE_CONFIGS.map(db => (
          <option key={db.id} value={db.id}>{db.name}</option>
        ))}
      </select>
      <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>
        (Ce choix est stocké localement, changement immédiat)
      </span>
    </div>
  );
};

export { DatabaseSelector }; 