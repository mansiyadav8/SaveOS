import React, { useState } from 'react';
import { generateActionPlan } from '../services/gemini';

export default function ActionAgent({ saveData }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateActionPlan(saveData);
      setPlan(result);
      setTasks(result.tasks);
    } catch (error) {
      alert("Failed to generate action plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].is_done = !updatedTasks[index].is_done;
    setTasks(updatedTasks);
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
      <h3 style={{ color: '#166534', marginTop: 0 }}>🚀 Action Agent</h3>
      <p style={{ color: '#15803d', fontSize: '14px', marginBottom: '15px' }}>
        Turn this insight into a concrete execution plan.
      </p>

      {!plan && (
        <button 
          onClick={handleGenerate}
          disabled={loading}
          style={{ 
            width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#16a34a', color: 'white',
            border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? ' Building your plan...' : '✨ Generate Action Plan'}
        </button>
      )}

      {plan && (
        <div>
          <h4 style={{ color: '#14532d', marginBottom: '15px' }}>{plan.plan_title}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task, index) => (
              <div 
                key={index} 
                onClick={() => toggleTask(index)}
                style={{ 
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px', backgroundColor: 'white', borderRadius: '8px',
                  border: `1px solid ${task.is_done ? '#86efac' : '#e5e7eb'}`,
                  cursor: 'pointer',
                  opacity: task.is_done ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                  border: `2px solid ${task.is_done ? '#16a34a' : '#9ca3af'}`,
                  backgroundColor: task.is_done ? '#16a34a' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '12px', fontWeight: 'bold'
                }}>
                  {task.is_done && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', textDecoration: task.is_done ? 'line-through' : 'none' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    {task.description}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px', fontStyle: 'italic' }}>
                    ⏱️ {task.estimated_time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}