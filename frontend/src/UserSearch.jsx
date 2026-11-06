import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [apiCalls, setApiCalls] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const timerRef = useRef(null);

  // DSA CONCEPT: Debounce (Reduce API calls)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(timerRef.current);
    setIsSearching(true);
    
    timerRef.current = setTimeout(async () => {
      try {
        // Real API Call to Rust backend
        const res = await axios.get(`http://127.0.0.1:8080/api/users/search?q=${query}`);
        setResults(res.data);
        setApiCalls((prev) => prev + 1);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Wait 300ms before calling

    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Search Users</h2>
      <input
        type="text"
        placeholder="Type a name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "8px", width: "250px", fontSize: "16px" }}
      />
      <p style={{ color: "gray", fontSize: "14px" }}>
        API Calls made: {apiCalls} {isSearching && "(searching...)"}
      </p>
      
      {results.length === 0 && query && !isSearching && (
        <p>No users found.</p>
      )}

      <ul>
        {results.map((user) => (
          <li key={user.id} style={{ padding: "5px 0" }}>
            <b>{user.display_name}</b> <span style={{ color: "gray" }}>@{user.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}