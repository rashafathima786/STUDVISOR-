import React from 'react';

/**
 * ChatbotLogo - A premium 3D chatbot logo component.
 * Uses the high-quality 3D renders generated for Studvisor.
 * 
 * @param {Object} props
 * @param {number} props.size - The size of the logo in pixels.
 * @param {string} props.className - Additional CSS classes.
 * @param {'icon' | 'logo'} props.mode - Whether to show the head icon or full logo.
 */
const ChatbotLogo = ({ size = 48, className = "", mode = "icon" }) => {
  const src = mode === "logo" ? "/bot-logo.png" : "/bot-icon.png";
  
  return (
    <div 
      className={`chatbot-logo-container ${className}`}
      style={{ 
        width: size, 
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '50%',
        background: 'transparent'
      }}
    >
      <img 
        src={src} 
        alt="Studvisor Chatbot"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          mixBlendMode: 'screen',
          filter: 'brightness(1.1) contrast(1.1)'
        }}
        className="animate-float"
      />
    </div>
  );
};

export default ChatbotLogo;
