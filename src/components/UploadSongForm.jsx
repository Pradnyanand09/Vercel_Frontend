import React, { useState } from 'react';
import axios from 'axios';

// Use VITE_API_URL if available, otherwise fallback to your Vercel backend URL
const API_URL = import.meta.env.VITE_API_URL || 'https://vercel-backend-blond.vercel.app';

const UploadSongForm = () => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setNote('');
    setAudioFile(null);
    setCoverFile(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!audioFile || !coverFile) {
      setUploadError('Please select both an audio file and a cover image.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('note', note);
    formData.append('audio', audioFile);
    formData.append('cover', coverFile);

    try {
      setLoading(true);
      // Post to the /api/songs/upload endpoint on your backend
      await axios.post(`${API_URL}/api/songs/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Song Uploaded Successfully');
      resetForm();
    } catch (error) {
      console.error(error);
      setUploadError('Upload Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-800 to-gray-900">
      <form
        onSubmit={handleUpload}
        className="w-full max-w-md bg-gray-900 m-8 rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-300 text-center mb-6">Upload New Song</h2>

        <input
          type="text"
          placeholder="Song Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Artist Name"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-800 text-white"
        />

        <label className="block text-gray-300 font-medium mb-2">Audio File:</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleAudioChange}
          required
          className="w-full mb-4 text-gray-300"
        />
        {audioFile && (
          <p className="text-sm text-gray-400 mb-2">Selected: {audioFile.name}</p>
        )}

        <label className="block text-gray-300 font-medium mb-2">Cover Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          required
          className="w-full mb-4 text-gray-300"
        />
        {coverFile && (
          <div className="mb-4">
            <p className="text-sm text-gray-400">Selected: {coverFile.name}</p>
            <img
              src={URL.createObjectURL(coverFile)}
              alt="Cover Preview"
              className="w-32 h-32 object-cover rounded-lg mt-2"
            />
          </div>
        )}

        {uploadError && (
          <p className="text-red-500 text-center mb-4">{uploadError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 mt-4 rounded-lg text-white transition duration-300 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Uploading...' : 'Upload Song'}
        </button>
      </form>
    </div>
  );
};

export default UploadSongForm;
