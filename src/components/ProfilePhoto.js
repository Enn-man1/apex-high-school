// src/components/ProfilePhoto.js
import React, { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:   '#E63946',
  teacher: '#2A9D8F',
  student: '#4361EE',
  parent:  '#7B2D8B',
};

export default function ProfilePhoto({
  uid,
  name,
  photoURL,
  role     = 'student',
  size     = 80,
  editable = true,
  onUpdated,
  style    = {},
}) {
  const [photo,     setPhoto]     = useState(photoURL || null);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [hovering,  setHovering]  = useState(false);
  const inputRef = useRef(null);

  const color    = ROLE_COLORS[role] || '#4361EE';
  const initials = name
    ?.split(' ')
    .map(n => n?.[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const borderRadius = Math.round(size * 0.22);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate size — max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB.');
      return;
    }

    // Validate uid
    if (!uid) {
      toast.error('User ID not found. Please refresh and try again.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Create storage reference
      const storageRef = ref(storage, `profiles/${uid}.jpg`);

      // Use resumable upload so we can track progress
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      // Track upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(pct);
        },
        (error) => {
          // Upload error
          console.error('Upload error:', error);
          switch (error.code) {
            case 'storage/unauthorized':
              toast.error('Permission denied. Check Firebase Storage rules.');
              break;
            case 'storage/canceled':
              toast.error('Upload was cancelled.');
              break;
            case 'storage/unknown':
              toast.error('Unknown error. Check your internet connection.');
              break;
            default:
              toast.error('Upload failed: ' + error.message);
          }
          setUploading(false);
          setProgress(0);
        },
        async () => {
          // Upload complete — get download URL
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);

            // Update Firestore
            await updateDoc(doc(db, 'users', uid), { photoURL: url });

            setPhoto(url);
            onUpdated?.(url);
            toast.success('✅ Profile photo updated!');
          } catch (firestoreErr) {
            console.error('Firestore update error:', firestoreErr);
            toast.error('Photo uploaded but profile update failed: ' + firestoreErr.message);
          } finally {
            setUploading(false);
            setProgress(0);
          }
        }
      );
    } catch (err) {
      console.error('Storage error:', err);
      toast.error('Failed to start upload: ' + err.message);
      setUploading(false);
      setProgress(0);
    }

    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      style={{
        position:   'relative',
        width:      size,
        height:     size,
        flexShrink: 0,
        cursor:     editable ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={() => editable && setHovering(true)}
      onMouseLeave={() => editable && setHovering(false)}
      onClick={() => editable && !uploading && inputRef.current?.click()}
      title={editable ? 'Click to upload a photo' : name}
    >
      {/* Photo or initials avatar */}
      {photo ? (
        <img
          src={photo}
          alt={name || 'Profile'}
          style={{
            width:        size,
            height:       size,
            borderRadius: borderRadius,
            objectFit:    'cover',
            display:      'block',
            border:       `2.5px solid ${color}50`,
            transition:   'filter 0.3s',
            filter:       hovering && editable ? 'brightness(0.65)' : 'brightness(1)',
          }}
          onError={() => setPhoto(null)} // fallback to initials if image fails
        />
      ) : (
        <div style={{
          width:          size,
          height:         size,
          borderRadius:   borderRadius,
          background:     `linear-gradient(135deg, ${color}30, ${color}18)`,
          border:         `2.5px solid ${color}50`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       size * 0.32,
          fontWeight:     900,
          color:          color,
          userSelect:     'none',
          transition:     'filter 0.3s',
          filter:         hovering && editable ? 'brightness(0.75)' : 'brightness(1)',
        }}>
          {initials}
        </div>
      )}

      {/* Hover overlay */}
      {editable && hovering && !uploading && (
        <div style={{
          position:       'absolute',
          inset:          0,
          borderRadius:   borderRadius,
          background:     'rgba(0,0,0,0.5)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            3,
          pointerEvents:  'none',
        }}>
          <span style={{ fontSize: Math.max(14, size * 0.22) }}>📷</span>
          <span style={{
            color:      '#fff',
            fontSize:   Math.max(9, size * 0.115),
            fontWeight: 700,
          }}>
            {photo ? 'Change' : 'Upload'}
          </span>
        </div>
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <div style={{
          position:       'absolute',
          inset:          0,
          borderRadius:   borderRadius,
          background:     'rgba(0,0,0,0.7)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            6,
        }}>
          {/* Circular spinner */}
          <div style={{
            width:          size * 0.32,
            height:         size * 0.32,
            border:         '3px solid rgba(255,255,255,0.25)',
            borderTopColor: '#F5A623',
            borderRadius:   '50%',
            animation:      'photoSpin 0.7s linear infinite',
          }} />
          {/* Progress % */}
          {progress > 0 && (
            <span style={{
              color:      '#fff',
              fontSize:   Math.max(9, size * 0.12),
              fontWeight: 700,
            }}>
              {progress}%
            </span>
          )}
        </div>
      )}

      {/* Camera badge — shown when not hovering */}
      {editable && !hovering && !uploading && (
        <div style={{
          position:       'absolute',
          bottom:         -4,
          right:          -4,
          width:          Math.max(22, size * 0.3),
          height:         Math.max(22, size * 0.3),
          borderRadius:   '50%',
          background:     color,
          border:         '2.5px solid #fff',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       Math.max(10, size * 0.15),
          boxShadow:      `0 2px 8px ${color}60`,
          pointerEvents:  'none',
        }}>
          📷
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        style={{ display:'none' }}
      />

      <style>{`
        @keyframes photoSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}