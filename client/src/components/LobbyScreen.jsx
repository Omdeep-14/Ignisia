import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const API = "http://localhost:5000";

export default function LobbyScreen({ session, onJoinRoom, onSignOut }) {
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const token = session.access_token;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProfile();
    fetchRooms();
  }, []);

  async function fetchProfile() {
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, org_id")
      .eq("id", session.user.id)
      .single();

    setProfile(prof);

    if (prof?.org_id) {
      const { data: org } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", prof.org_id)
        .single();
      setOrgName(org?.name ?? "");
    }
  }

  async function fetchRooms() {
    setLoading(true);
    const res = await fetch(`${API}/api/rooms`, { headers });
    const data = await res.json();
    setRooms(data.rooms ?? []);
    setLoading(false);
  }

  async function createRoom() {
    if (!newRoomName.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch(`${API}/api/rooms/create`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoomName.trim() }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setCreating(false);
      return;
    }
    setCreating(false);
    setShowCreate(false);
    setNewRoomName("");
    onJoinRoom(data.room, session);
  }

  async function joinRoom() {
    if (!joinCode.trim()) return;
    setError("");
    const res = await fetch(`${API}/api/rooms/join`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ code: joinCode.trim() }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    onJoinRoom(data.room, session);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg tracking-tight">Ignisia</h1>
          {orgName && <p className="text-xs text-gray-400 mt-0.5">{orgName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{profile?.display_name}</span>
          <button
            onClick={onSignOut}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Active rooms</h2>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Create room
          </button>
        </div>

        {/* Create room form */}
        {showCreate && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium mb-3">New room</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createRoom()}
                placeholder="e.g. Q3 Audit Review"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                onClick={createRoom}
                disabled={creating || !newRoomName.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-900 font-semibold text-sm px-4 rounded-lg transition-colors"
              >
                {creating ? "..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* Join with code */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-3">Join with code</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              placeholder="e.g. FIN4BZ29"
              maxLength={8}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={joinRoom}
              disabled={joinCode.length < 6}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-semibold text-sm px-4 rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-red-400 text-xs bg-red-950 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Room list */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-sm">No active rooms yet.</p>
            <p className="text-xs mt-1">Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onJoinRoom(room, session)}
                className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{room.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(room.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                    {room.code}
                  </span>
                  <span className="text-amber-500 text-sm">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
