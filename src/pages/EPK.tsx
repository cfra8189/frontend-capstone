import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import Header from '../components/Header';
import ProfileImageUpload from '../components/ProfileImageUpload';

interface EPKData {
  artistName: string;
  bio: string;
  genre: string;
  location: string;
  website: string;
  socialMedia: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    soundcloud?: string;
  };
  musicLinks: string[];
  pressPhotos: string[];
  contactEmail: string;
  bookingEmail: string;
  managementEmail: string;
  achievements: string[];
  upcomingShows: Array<{
    date: string;
    venue: string;
    location: string;
    ticketLink?: string;
  }>;
}

export default function EPK() {
  const { user } = useAuth();
  const [epkData, setEpkData] = useState<EPKData>({
    artistName: user?.displayName || '',
    bio: '',
    genre: '',
    location: '',
    website: '',
    socialMedia: {},
    musicLinks: [],
    pressPhotos: [],
    contactEmail: user?.email || '',
    bookingEmail: '',
    managementEmail: '',
    achievements: [],
    upcomingShows: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || null);

  useEffect(() => {
    // Load EPK data from backend
    loadEPKData();
  }, []);

  const loadEPKData = async () => {
    try {
      const response = await fetch('/api/epk');
      if (response.ok) {
        const data = await response.json();
        if (data.epk) {
          setEpkData(data.epk);
        }
      }
    } catch (error) {
      console.error('Failed to load EPK data:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/epk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(epkData),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'EPK saved successfully!' });
        setIsEditing(false);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.message || 'Failed to save EPK' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save EPK' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/epk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(epkData),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'EPK updated successfully!' });
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.message || 'Failed to update EPK' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to update EPK' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    // Generate and download PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>EPK - ${epkData.artistName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; }
            .profile-img { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .social-links a { margin-right: 15px; color: #007bff; text-decoration: none; }
            .music-links a { display: block; margin-bottom: 5px; color: #007bff; text-decoration: none; }
            .shows { margin-top: 20px; }
            .show-item { margin-bottom: 10px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          ${generateEPKHTML()}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const generateEPKHTML = () => {
    return `
      <div class="header">
        ${profileImageUrl ? `<img src="${profileImageUrl}" alt="${epkData.artistName}" class="profile-img">` : ''}
        <h1>${epkData.artistName}</h1>
        <p><strong>${epkData.genre}</strong> • ${epkData.location}</p>
        ${epkData.website ? `<p><a href="${epkData.website}">${epkData.website}</a></p>` : ''}
      </div>

      <div class="section">
        <h2>Bio</h2>
        <p>${epkData.bio || 'Bio coming soon...'}</p>
      </div>

      <div class="section">
        <h2>Social Media</h2>
        <div class="social-links">
          ${epkData.socialMedia.spotify ? `<a href="${epkData.socialMedia.spotify}">Spotify</a>` : ''}
          ${epkData.socialMedia.instagram ? `<a href="${epkData.socialMedia.instagram}">Instagram</a>` : ''}
          ${epkData.socialMedia.twitter ? `<a href="${epkData.socialMedia.twitter}">Twitter</a>` : ''}
          ${epkData.socialMedia.youtube ? `<a href="${epkData.socialMedia.youtube}">YouTube</a>` : ''}
          ${epkData.socialMedia.soundcloud ? `<a href="${epkData.socialMedia.soundcloud}">SoundCloud</a>` : ''}
        </div>
      </div>

      <div class="section">
        <h2>Music</h2>
        <div class="music-links">
          ${epkData.musicLinks.map(link => `<a href="${link}">${link}</a>`).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Contact</h2>
        <p><strong>Email:</strong> ${epkData.contactEmail}</p>
        ${epkData.bookingEmail ? `<p><strong>Booking:</strong> ${epkData.bookingEmail}</p>` : ''}
        ${epkData.managementEmail ? `<p><strong>Management:</strong> ${epkData.managementEmail}</p>` : ''}
      </div>

      ${epkData.achievements.length > 0 ? `
        <div class="section">
          <h2>Achievements</h2>
          <ul>
            ${epkData.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${epkData.upcomingShows.length > 0 ? `
        <div class="section shows">
          <h2>Upcoming Shows</h2>
          ${epkData.upcomingShows.map(show => `
            <div class="show-item">
              <strong>${show.date}</strong> - ${show.venue} (${show.location})
              ${show.ticketLink ? `<br><a href="${show.ticketLink}">Get Tickets</a>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  };

  const renderEditableField = (label: string, field: keyof EPKData, type: 'text' | 'textarea' = 'text') => {
    const value = epkData[field];
    
    if (isEditing) {
      return type === 'textarea' ? (
        <textarea
          value={String(value || '')}
          onChange={(e) => setEpkData({ ...epkData, [field]: e.target.value })}
          className="input-field w-full p-3 rounded"
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => setEpkData({ ...epkData, [field]: e.target.value })}
          className="input-field w-full p-3 rounded"
        />
      );
    }
    
    return <p className="text-theme-secondary">{String(value || 'Not specified')}</p>;
  };

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />
      
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-theme-primary">Electronic Press Kit</h1>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded border border-theme-tertiary text-theme-secondary hover:bg-theme-tertiary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="btn-primary px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Update'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDownloadPDF}
                  className="btn-primary px-4 py-2 rounded font-bold"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary px-4 py-2 rounded font-bold"
                >
                  Edit EPK
                </button>
              </>
            )}
          </div>
        </div>

        {saveMessage && (
          <div className={`p-4 rounded mb-6 ${saveMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {saveMessage.text}
          </div>
        )}

        <div className="card p-8 rounded-xl">
          {/* Profile Section */}
          <div className="flex items-center gap-8 mb-8">
            <ProfileImageUpload
              currentImageUrl={profileImageUrl}
              onImageUpdate={setProfileImageUrl}
              size="large"
            />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={epkData.artistName}
                  onChange={(e) => setEpkData({ ...epkData, artistName: e.target.value })}
                  className="text-3xl font-bold bg-theme-secondary border border-theme-tertiary rounded px-3 py-2 w-full"
                />
              ) : (
                <h1 className="text-3xl font-bold text-theme-primary">{epkData.artistName}</h1>
              )}
              <div className="flex gap-4 mt-2">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={epkData.genre}
                      onChange={(e) => setEpkData({ ...epkData, genre: e.target.value })}
                      placeholder="Genre"
                      className="bg-theme-secondary border border-theme-tertiary rounded px-3 py-1"
                    />
                    <input
                      type="text"
                      value={epkData.location}
                      onChange={(e) => setEpkData({ ...epkData, location: e.target.value })}
                      placeholder="Location"
                      className="bg-theme-secondary border border-theme-tertiary rounded px-3 py-1"
                    />
                  </>
                ) : (
                  <>
                    <span className="text-accent font-bold">{epkData.genre || 'Genre'}</span>
                    <span className="text-theme-secondary">•</span>
                    <span className="text-theme-secondary">{epkData.location || 'Location'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-theme-primary mb-4">Bio</h2>
            {renderEditableField('', 'bio', 'textarea')}
          </div>

          {/* Social Media Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-theme-primary mb-4">Social Media</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(epkData.socialMedia).map(([platform, url]) => (
                <div key={platform}>
                  <label className="block text-sm text-theme-muted mb-1 capitalize">{platform}</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={url || ''}
                      onChange={(e) => setEpkData({
                        ...epkData,
                        socialMedia: { ...epkData.socialMedia, [platform]: e.target.value }
                      })}
                      className="input-field w-full p-2 rounded"
                      placeholder={`https://${platform}.com/...`}
                    />
                  ) : (
                    <p className="text-theme-secondary">
                      {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{url}</a> : 'Not specified'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-theme-primary mb-4">Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">Contact Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={epkData.contactEmail}
                    onChange={(e) => setEpkData({ ...epkData, contactEmail: e.target.value })}
                    className="input-field w-full p-2 rounded"
                  />
                ) : (
                  <p className="text-theme-secondary">{epkData.contactEmail}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">Booking Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={epkData.bookingEmail}
                    onChange={(e) => setEpkData({ ...epkData, bookingEmail: e.target.value })}
                    className="input-field w-full p-2 rounded"
                  />
                ) : (
                  <p className="text-theme-secondary">{epkData.bookingEmail || 'Not specified'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">Management Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={epkData.managementEmail}
                    onChange={(e) => setEpkData({ ...epkData, managementEmail: e.target.value })}
                    className="input-field w-full p-2 rounded"
                  />
                ) : (
                  <p className="text-theme-secondary">{epkData.managementEmail || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Website Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-theme-primary mb-4">Website</h2>
            {isEditing ? (
              <input
                type="url"
                value={epkData.website}
                onChange={(e) => setEpkData({ ...epkData, website: e.target.value })}
                className="input-field w-full p-3 rounded"
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <p className="text-theme-secondary">
                {epkData.website ? <a href={epkData.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{epkData.website}</a> : 'Not specified'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
