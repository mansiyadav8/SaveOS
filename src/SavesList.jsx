
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";

function SavesList() {
  const [saves, setSaves] = useState([]);

  useEffect(() => {
    const savesQuery = query(
      collection(db, "saves"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      savesQuery,
      (snapshot) => {
        setSaves(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      },
      (error) => {
        console.error("Could not load saves:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <section>
      <h2>My Saves</h2>

      {saves.length === 0 ? (
        <p>No saves found yet.</p>
      ) : (
        saves.map((save) => (
          <div key={save.id}>
            <p><strong>{save.fileName}</strong></p>
            <p>Status: {save.status}</p>
          </div>
        ))
      )}
    </section>
  );
}

export default SavesList;
