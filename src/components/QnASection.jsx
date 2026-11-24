import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Heart, Mail, Play, Image as ImageIcon } from 'lucide-react';
import { BIRTHDAY_CONFIG } from '../config';
import ImageMemoriesModal from './ImageMemoriesModal';
import VideoMemoriesModal from './VideoMemoriesModal';
import SeeThisView from './SeeThisView';
import { audioController } from '../utils/audioController';

/**
 * QnASection Component
 *
 * Rebuilt interactive Q&A experience and final Message for You:
 * 1. Opens directly with Question 1 (zero categories, zero category-selection screens).
 * 2. Exactly 10 questions total, displayed one at a time.
 * 3. 4 options in a 2x2 layout with individual left/right message cards:
 *    - Option 1 (top-left) & Option 3 (bottom-left) -> Left side
 *    - Option 2 (top-right) & Option 4 (bottom-right) -> Right side
 *    - Clicking an option toggles its message; selecting does NOT advance question.
 * 4. Previous & Next buttons:
 *    - Question 1: Previous is hidden/disabled.
 *    - Question 10: Next navigates to the "Message for You" button screen.
 * 5. After Question 10:
 *    - Entire question interface is removed.
 *    - Single elegant glass button in center: "💌 Message for You".
 * 6. Final Surprise Screen:
 *    - 3-card layout inspired by Main Birthday section:
 *      * Message Card (scrollable, editable paragraphs)
 *      * Image Card (click opens ImageMemoriesModal)
 *      * Video Card (click opens VideoMemoriesModal with audio priority)
 * 7. "See This View": Fullscreen background-only mode with Escape / click-to-exit.
 * 8. Silent background music: Zero player controls rendered; plays continuously from public/QNA-music/.
 */
export default function QnASection({
  onBackToHappyGallery,
  onPreviousPage,
  initialStep = 'question',
  initialQuestionIndex = 0,
  initialSelectedOptionId = null,
  initialOpenMessage = null,
  onProgressChange,
}) {
  const handlePreviousNavigation = onPreviousPage || onBackToHappyGallery;
  const qnaConfig = BIRTHDAY_CONFIG.qna || {};
  const questions = useMemo(() => (qnaConfig.questions || []).slice(0, 10), [qnaConfig.questions]);
  const finalMessage = qnaConfig.finalMessage || {};

  // Configured media for Final Message
  const firstCardMedia = finalMessage.imageCardMedia || finalMessage.image || '/last-msg/1.mp4';
  const secondCardMedia = finalMessage.videoCardMedia || finalMessage.video || '/last-msg/2.mp4';
  const isFirstCardVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(firstCardMedia);
  const firstCardVideoRef = useRef(null);

  // 'question' | 'button' | 'final-message'
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [questionIndex, setQuestionIndex] = useState(
    typeof initialQuestionIndex === 'number' && initialQuestionIndex >= 0 && initialQuestionIndex < 10
      ? initialQuestionIndex
      : 0
  );

  // Synchronize with external initialStep / initialQuestionIndex changes
  useEffect(() => {
    if (initialStep && initialStep !== currentStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  useEffect(() => {
    if (typeof initialQuestionIndex === 'number' && initialQuestionIndex !== questionIndex) {
      setQuestionIndex(initialQuestionIndex);
    }
  }, [initialQuestionIndex]);

  // Active selected option and open message card
  const [selectedOptionId, setSelectedOptionId] = useState(initialSelectedOptionId || null);
  const [openMessage, setOpenMessage] = useState(initialOpenMessage || null);

  // Notify parent of progress changes for temporary in-memory navigation restoration
  useEffect(() => {
    onProgressChange?.({
      step: currentStep,
      questionIndex,
      selectedOptionId,
      openMessage,
    });
  }, [currentStep, questionIndex, selectedOptionId, openMessage, onProgressChange]);

  // Modal states for Final Message media
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Scroll ref for final message card
  const messageScrollRef = useRef(null);

  const currentQuestion = questions[questionIndex] || questions[0];
  const bgImage = qnaConfig.background || qnaConfig.image || '/QNA-image.png';

  // Start Q&A background music when Q&A section mounts
  useEffect(() => {
    audioController.startQnaPlayback();

    const handleFirstUserInteraction = () => {
      const qnaAudio = audioController.getAudio('qna');
      if (qnaAudio && qnaAudio.paused) {
        audioController.startQnaPlayback();
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true });
    window.addEventListener('keydown', handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
    };
  }, []);

  // DOM references for measuring vertical alignment without altering main Q&A card layout
  const cardRef = useRef(null);
  const optionRefs = useRef([]);
  const [optionYPositions, setOptionYPositions] = useState({});

  const updateOptionPositions = useCallback(() => {
    if (!cardRef.current) return;
    const cardRect = cardRef.current.getBoundingClientRect();
    const positions = {};
    optionRefs.current.forEach((el, idx) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        // Distance from top of the main Q&A card to the exact vertical center of the option
        positions[idx] = (rect.top + rect.height / 2) - cardRect.top;
      }
    });
    setOptionYPositions(positions);
  }, []);

  useEffect(() => {
    updateOptionPositions();
    window.addEventListener('resize', updateOptionPositions);
    return () => window.removeEventListener('resize', updateOptionPositions);
  }, [updateOptionPositions, questionIndex, currentStep]);

  // Reset selected option and message card whenever question changes
  const handleQuestionChange = useCallback((newIndex) => {
    setSelectedOptionId(null);
    setOpenMessage(null);
    setQuestionIndex(newIndex);
  }, []);

  // Handle Option Click (Option 1 & 3 -> Left, Option 2 & 4 -> Right)
  const handleOptionClick = (option, index) => {
    const side = index % 2 === 0 ? 'left' : 'right';
    const row = index < 2 ? 'top' : 'bottom';

    // If already active and open, clicking again closes/toggles it
    if (selectedOptionId === option.id && openMessage) {
      setSelectedOptionId(null);
      setOpenMessage(null);
      return;
    }

    // Select this option and open its message card on the designated side
    setSelectedOptionId(option.id);
    setOpenMessage({
      side,
      row,
      optionIndex: index,
      optionId: option.id,
      emoji: option.emoji || '💬',
      text: option.message || option.text || 'A sweet thought just for you. ♡',
    });

    requestAnimationFrame(() => {
      updateOptionPositions();
    });
  };

  const handleCloseMessage = () => {
    setOpenMessage(null);
  };

  // Previous button handler
  const handlePrev = () => {
    if (questionIndex > 0) {
      handleQuestionChange(questionIndex - 1);
    }
  };

  // Next button handler
  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      handleQuestionChange(questionIndex + 1);
    } else {
      // Reached Question 10: navigate to Message for You button screen
      setSelectedOptionId(null);
      setOpenMessage(null);
      setCurrentStep('button');
    }
  };

  // Handle first card looping video modal play/pause and cleanup
  useEffect(() => {
    if (isImageModalOpen && isFirstCardVideo && firstCardVideoRef.current) {
      firstCardVideoRef.current.currentTime = 0;
      firstCardVideoRef.current.play().catch(() => {});
    } else if (!isImageModalOpen && firstCardVideoRef.current) {
      firstCardVideoRef.current.pause();
    }
  }, [isImageModalOpen, isFirstCardVideo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isImageModalOpen) setIsImageModalOpen(false);
        if (isVideoModalOpen) setIsVideoModalOpen(false);
        handleCloseMessage();
      } else if (currentStep === 'question') {
        if (e.key === 'ArrowRight') handleNext();
        else if (e.key === 'ArrowLeft' && questionIndex > 0) handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, questionIndex, questions.length, isImageModalOpen, isVideoModalOpen]);

  return (
    <div className="qna-root" role="region" aria-label="Moments & Memories Q&A">
      {/* 1. Full-Section Nature Picnic Background */}
      <div className="qna-background-wrapper" aria-hidden="true">
        <img
          src={bgImage}
          alt="Q&A Nature Background"
          className="qna-background-img"
        />
      </div>

      {/* Top Left Corner Navigation Button: Previous Page */}
      <button
        type="button"
        onClick={handlePreviousNavigation}
        className="corner-nav-btn corner-nav-prev"
        aria-label="Previous Page: Return to Happy Gallery"
        title="Return to Previous Page"
      >
        <ArrowLeft size={16} className="corner-nav-icon" />
        <span className="corner-nav-text">Previous Page</span>
      </button>

      {/* ==================================================================== */}
      {/* STEP 1: QUESTION SCREEN (QUESTIONS 1 TO 10)                          */}
      {/* ==================================================================== */}
      {currentStep === 'question' && currentQuestion && (
        <div className="qna-screen-container qna-question-stage">
          {/* CENTER QUESTION CARD (STRICTLY FIXED POSITION & DIMENSIONS) */}
          <div
            ref={cardRef}
            className="qna-glass-card qna-question-card qna-fade-in"
          >
            {/* Top Meta Header: Heading + Question Number */}
            <div className="qna-question-header">
              <span className="qna-heading-label">
                {qnaConfig.heading || 'Moments & Memories Q&A'}
              </span>

              <span className="qna-qnum-badge">
                Question {questionIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <div className="qna-question-body">
              <h2 className="qna-question-text">{currentQuestion.question}</h2>
            </div>

            {/* 2x2 Answer Options Grid */}
            <div className="qna-options-grid">
              {(currentQuestion.options || []).map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const sideLabel = idx % 2 === 0 ? 'left' : 'right';

                return (
                  <button
                    key={opt.id || idx}
                    ref={(el) => (optionRefs.current[idx] = el)}
                    type="button"
                    onClick={() => handleOptionClick(opt, idx)}
                    className={`qna-option-btn option-${idx + 1} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    aria-pressed={isSelected}
                    data-side={sideLabel}
                  >
                    <span className="qna-option-emoji">{opt.emoji || '🌸'}</span>
                    <span className="qna-option-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Previous and Next Navigation Footer */}
            <div className="qna-question-footer">
              <button
                type="button"
                onClick={handlePrev}
                disabled={questionIndex === 0}
                className={`qna-nav-btn qna-nav-prev ${questionIndex === 0 ? 'is-disabled' : ''}`}
                aria-label="Previous Question"
                style={{ visibility: questionIndex === 0 ? 'hidden' : 'visible' }}
              >
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>

              <div className="qna-qnum-indicator">
                Question {questionIndex + 1} of {questions.length}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="qna-nav-btn qna-nav-next"
                aria-label={
                  questionIndex === questions.length - 1 ? 'Go to Message for You' : 'Next Question'
                }
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* SEPARATE COMPACT PERSONAL MESSAGE CARD (OUTSIDE MAIN Q&A CARD, BESIDE SELECTED ANSWER) */}
            {openMessage && (
              <aside
                className={`qna-floating-message-card pos-${openMessage.side} ${
                  openMessage.row ? `row-${openMessage.row}` : ''
                }`}
                style={{
                  top: optionYPositions[openMessage.optionIndex] != null
                    ? `${optionYPositions[openMessage.optionIndex]}px`
                    : openMessage.optionIndex < 2
                    ? '46%'
                    : '68%',
                }}
                role="region"
                aria-label="Personal thought"
              >
                <div className="qna-floating-connector" aria-hidden="true" />
                <p className="qna-floating-message-text">{openMessage.text}</p>
              </aside>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 2: ELEGANT "MESSAGE FOR YOU" BUTTON SCREEN (AFTER QUESTION 10)  */}
      {/* ==================================================================== */}
      {currentStep === 'button' && (
        <div className="qna-screen-container qna-fade-in">
          <div className="qna-message-for-you-trigger-card">
            <button
              type="button"
              onClick={() => setCurrentStep('final-message')}
              className="qna-final-surprise-btn"
              aria-label="Open Message for You"
            >
              <Mail className="qna-surprise-btn-icon" />
              <span>{finalMessage.buttonText ? `💌 ${finalMessage.buttonText}` : '💌 Message for You'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STEP 3: FINAL SURPRISE SCREEN (MAIN-SECTION-STYLE 3-CARD LAYOUT)     */}
      {/* ==================================================================== */}
      {currentStep === 'final-message' && (
        <div className="qna-screen-container qna-final-surprise-stage qna-fade-in">
          {/* Back to questions shortcut */}
          <div className="qna-final-top-bar">
            <button
              type="button"
              onClick={() => {
                setQuestionIndex(9);
                setCurrentStep('question');
              }}
              className="qna-sub-back-btn"
              aria-label="Back to Questions"
            >
              <ChevronLeft size={16} />
              <span>Back to Questions</span>
            </button>
          </div>

          <div className="qna-final-content-layout">
            {/* 1. MESSAGE CARD (LEFT COLUMN, PRIMARY) */}
            <section className="qna-final-left-column" aria-label="Personal Birthday Message">
              <h1 className="qna-final-page-title">
                {finalMessage.heading || 'A Very Special Message Just for You ♡'}
              </h1>

              <article className="qna-glass-card qna-final-message-card">
                <div
                  ref={messageScrollRef}
                  className="qna-final-message-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Scrollable final birthday message"
                >
                  {(finalMessage.paragraphs || []).map((p, idx) => (
                    <p key={idx} className="qna-final-paragraph">
                      {p}
                    </p>
                  ))}

                  {(finalMessage.closing || finalMessage.signature) && (
                    <div className="qna-final-signoff">
                      {finalMessage.closing && (
                        <div className="qna-final-closing">{finalMessage.closing}</div>
                      )}
                      {finalMessage.signature && (
                        <div className="qna-final-signature">{finalMessage.signature}</div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            </section>

            {/* 2 & 3. RIGHT COLUMN: IMAGE CARD POSITION (1.mp4) + VIDEO CARD POSITION (2.mp4) */}
            <aside className="qna-final-right-column" aria-label="Special Video Clips">
              {/* Card 1: Looping control-free video (Image Card position) */}
              <div
                className="qna-glass-card qna-final-image-card"
                onClick={() => setIsImageModalOpen(true)}
                role="button"
                tabIndex={0}
                aria-label={isFirstCardVideo ? "Click to view video in full" : "Click to view photo in full"}
                title={isFirstCardVideo ? "Click to view large video" : "Click to view large photo"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsImageModalOpen(true);
                  }
                }}
              >
                <div className="qna-final-image-frame">
                  {isFirstCardVideo ? (
                    <video
                      src={firstCardMedia}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={false}
                      className="qna-final-portrait-video"
                      onError={() => setImageError(true)}
                    />
                  ) : !imageError && firstCardMedia ? (
                    <img
                      src={firstCardMedia}
                      alt="Special moment memory"
                      className="qna-final-portrait-image"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="qna-final-empty-media-box">
                      <Play size={32} className="text-amber-300 mb-2 opacity-75" />
                      <span className="qna-final-empty-tag">Special Clip</span>
                      <p className="qna-final-empty-note">"Place 1.mp4 into public/last-msg/"</p>
                    </div>
                  )}
                </div>
                <div className="qna-final-media-badge">
                  <span>{isFirstCardVideo ? 'Click to view full video' : 'Click to view full photo'}</span>
                </div>
              </div>

              {/* Card 2: Normal controllable video (Video Card position) */}
              <div
                className="qna-glass-card qna-final-video-card"
                onClick={() => setIsVideoModalOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="Click to watch birthday video clip"
                title="Click to watch video clip"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsVideoModalOpen(true);
                  }
                }}
              >
                <div className="qna-final-video-preview-wrapper">
                  {!videoError && secondCardMedia ? (
                    <div className="qna-final-video-thumbnail">
                      <video
                        src={secondCardMedia}
                        className="qna-final-video-thumb-elem"
                        muted
                        preload="metadata"
                        onError={() => setVideoError(true)}
                      />
                      <div className="qna-final-play-overlay">
                        <span className="qna-final-play-icon">
                          <Play size={20} fill="#fff" />
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="qna-final-empty-media-box">
                      <Play size={32} className="text-amber-300 mb-2 opacity-75" />
                      <span className="qna-final-empty-tag">Video Clip</span>
                      <p className="qna-final-empty-note">"Place 2.mp4 into public/last-msg/"</p>
                    </div>
                  )}
                </div>

                <div className="qna-final-link-box">
                  <span className="qna-final-link-text">Clip for You &raquo;</span>
                </div>
              </div>
            </aside>
          </div>

          {/* First Card Modal: Looping, control-free video (or image modal if image) */}
          {isFirstCardVideo ? (
            isImageModalOpen && (
              <div
                className="image-modal-backdrop is-open"
                onClick={() => setIsImageModalOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Enlarged Special Video"
              >
                <div
                  className="image-modal-card is-open gallery-media-modal-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(false)}
                    className="image-modal-close-btn"
                    aria-label="Close video viewer"
                    title="Close (Esc)"
                  >
                    <X className="image-close-icon" />
                  </button>
                  <div className="gallery-modal-video-stage">
                    <video
                      ref={firstCardVideoRef}
                      src={firstCardMedia}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={false}
                      className="gallery-modal-video-element"
                    />
                  </div>
                </div>
              </div>
            )
          ) : (
            <ImageMemoriesModal
              isOpen={isImageModalOpen}
              onClose={() => setIsImageModalOpen(false)}
              imageSrc={firstCardMedia}
              alt="Final birthday memory photo"
            />
          )}

          {/* Second Card Modal: Normal controllable video with Play/Pause & Volume */}
          <VideoMemoriesModal
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
            videoSrc={secondCardMedia}
            sectionNumber={10}
            sectionTitle="Message for You"
          />
        </div>
      )}
    </div>
  );
}
