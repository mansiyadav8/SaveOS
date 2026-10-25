import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand" style={{ padding: 0, marginBottom: 24 }}>
          <span className="brand-mark">▣</span>
          <span><span className="brand-name">SaveOS</span><span className="brand-caption">Autonomous Memory</span></span>
        </div>
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p>Save what inspires you. Find it when you need it.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}</button>
        </form>
        {message && <p className="notice" role="alert">{message}</p>}
        <button className="auth-switch" type="button" onClick={() => { setIsSignup(!isSignup); setMessage(""); }}>
          {isSignup ? "Already registered? Sign in" : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}

export default Auth;
