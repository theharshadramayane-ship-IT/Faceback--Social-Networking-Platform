import { useEffect, useMemo, useRef, useState } from "react";

// Fake users for now
const MOCK_USERS = [
  "harshad", "harsh", "harry", "priya", "pranav", "raj",
  "riya", "sahil", "sakshi", "tanvi", "varun", "yash",
];

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [apiCalls, setApiCalls] = useState(0);

  // DSA CONCEPT 1: Map (O(1) lookup)
  const usersByLetter = useMemo(() => {
    const map = new Map();
    for (const user of MOCK_USERS) {
      const firstLetter = user[0].toLowerCase();
      if (!map.has(firstLetter)) map.set(firstLetter, []);
      map.get(firstLetter).push(user);
    }
    return map;
  }, []);

  const timerRef = useRef(null);

  // DSA CONCEPT 2: Debounce (Reduce API calls)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      // Simulate API Call using the Map
      const bucket = usersByLetter.get(query[0].toLowerCase()) || [];
      const filtered = bucket.filter((u) => u.toLowerCase().includes(query.toLowerCase()));
      
      setResults(filtered);
      setApiCalls((prev) => prev + 1);
    }, 300); // Wait 300ms before calling

    return () => clearTimeout(timerRef.current);
  }, [query, usersByLetter]);

  return (
    <div>
      <h2>Search Users</h2>
      <input
        type="text"
        placeholder="Type a name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "8px", width: "250px", fontSize: "16px" }}
      />
      <p>API Calls made: {apiCalls}</p>
      <ul>
        {results.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </div>
  );
}