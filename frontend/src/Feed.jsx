import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    // Fetch initial feed
    axios.get("http://127.0.0.1:8080/api/posts")
      .then((res) => setPosts(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;

    try {
      await axios.post("http://127.0.0.1:8080/api/posts", {
        content: content,
        user_id: user.id,
      });

      // DSA CONCEPT: Array Prepend (unshift)
      // We add the new post to the TOP of the array instantly (Optimistic UI)
      const newPost = {
        id: crypto.randomUUID(),
        user_id: user.id,
        display_name: user.display_name,
        username: user.username,
        content: content,
        created_at: new Date().toISOString(),
      };

      setPosts((prevPosts) => [newPost, ...prevPosts]);
      setContent("");
      inputRef.current?.focus();
    } catch (err) {
      alert("Failed to post");
    }
  };

  if (loading) return <p>Loading feed...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", marginTop: "20px" }}>
      
      {/* Create Post Box */}
      <div style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          style={{ width: "100%", height: "60px", padding: "10px", fontSize: "16px", marginBottom: "10px" }}
        />
        <button 
          onClick={handlePost} 
          style={{ padding: "8px 16px", background: "#007bff", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          Post
        </button>
      </div>

      {/* Feed List */}
      <div>
        {posts.map((post) => (
          <div key={post.id} style={{ border: "1px solid #eee", padding: "15px", marginBottom: "10px", borderRadius: "8px" }}>
            <h4 style={{ margin: 0 }}>{post.display_name} <span style={{ color: "gray", fontSize: "14px" }}>@{post.username}</span></h4>
            <p style={{ fontSize: "12px", color: "gray", margin: "5px 0" }}>
              {new Date(post.created_at).toLocaleString()}
            </p>
            <p style={{ marginTop: "10px", fontSize: "16px" }}>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}