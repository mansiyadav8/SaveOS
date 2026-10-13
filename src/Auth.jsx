
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
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

    try {
      setLoading(true);

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
    <div>
      <h2>{isSignup ? "Create your SaveOS account" : "Welcome back"}</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isSignup
              ? "Sign up"
              : "Sign in"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={() => {
          setIsSignup(!isSignup);
          setMessage("");
        }}
      >
        {isSignup
          ? "Already registered? Sign in"
          : "New here? Create an account"}
      </button>
    </div>
  );
}

export default Auth;
