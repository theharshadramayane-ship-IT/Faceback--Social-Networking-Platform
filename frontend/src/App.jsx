import { useEffect, useState } from "react";
import UserSearch from "./UserSearch";

function App() {
  const [health, setHealth] = useState({ status: "loading", db: "..." });

  useEffect(() => {
    fetch("http://127.0.0.1:8080/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: "error", db: "down" }));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Faceback</h1>
      <h3>
        Backend: {health.status} | DB: {health.db}
      </h3>
      <hr />
      <UserSearch />
    </div>
  );
}

export default App;