import React from 'react';

export default function UserAvatar({ avatar, size = 'md', className = '' }) {
  const isImage = avatar && (avatar.startsWith('http') || avatar.startsWith('data:image') || avatar.startsWith('blob:'));

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl',
    xl: 'w-16 h-16 text-3xl'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (isImage) {
    return (
      <img
        src={avatar}
        alt="avatar"
        className={`${currentSize} rounded-2xl object-cover border border-amber-500/30 shadow-xs ${className}`}
      />
    );
  }

  return (
    <div className={`${currentSize} rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs ${className}`}>
      <span>{avatar || '👤'}</span>
    </div>
  );
}
