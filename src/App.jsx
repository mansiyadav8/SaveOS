import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import Dashboard from "./components/Dashboard"; // Import the new Dashboard

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return <p>Loading SaveOS...</p>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {!user ? (
        <Auth />
      ) : (
        <>
          {/* Simple Top Bar for Auth info */}
          <div style={{ padding: '15px 30px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '20px' }}>SaveOS 🧠</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '14px', color: '#4b5563' }}>Signed in as: {user.email}</span>
              <button 
                onClick={() => signOut(auth)}
                style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* The Main Dashboard */}
          <Dashboard />
        </>
      )}
    </div>
  );
}

export default App;