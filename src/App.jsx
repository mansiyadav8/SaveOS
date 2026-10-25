import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return <div className="loading-screen"><div className="brand"><span className="brand-mark">▣</span><span className="brand-name">Loading SaveOS...</span></div></div>;
  }

  if (!user) {
    return <Auth />;
  }

  return <Dashboard user={user} onSignOut={() => signOut(auth)} />;
}

export default App;
