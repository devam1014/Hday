import React, { useState } from 'react';
import { Wrench, Play, Sparkles, Heart, RotateCcw, ChevronDown, ChevronUp, BookOpen, Clock, Flame, ArrowRight } from 'lucide-react';
import { BIRTHDAY_CONFIG } from '../config';

/**
 * Dev Controls Component
 * Provides isolated testing for:
 * 1. Test Option A: Cover Timer Test (Cover -> Firecracker page, Timer 2 visible, zero fireworks)
 * 2. Test Option B: Firecracker Timer Test (Firecracker page -> Fireworks celebration forms HAPPY BIRTHDAY, waits for heart click)
 * 3. Live 5s Countdowns (Timer 1 and Timer 2)
 * 4. Section Navigation Previews
 * 5. Clean Config Reset
 */
export default function DevControls({
  currentStage,
  onClickAndSee,
  onTestCoverTimer,
  onTestFirecrackerTimer,
  onJumpToCountdown,
  onJumpToFireworksPage,
  onJumpToMainPage,
  onJumpToSadMemories,
  onJumpToHappyGallery,
  onJumpToQnA,
  onTriggerCover5sCountdown,
  onTriggerFirecracker5sCountdown,
  onResetToDefaultConfig
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!BIRTHDAY_CONFIG.dev.showDevControls) return null;

  return (
    <aside className="dev-test-panel" aria-label="Development Test Helper">
      <div className="dev-panel-top-row">
        {currentStage === 'fireworks' && onClickAndSee && (
          <button
            type="button"
            onClick={onClickAndSee}
            className="dev-panel-toggle-btn dev-click-see-btn"
            title="Preview 10s countdown to full fireworks celebration"
          >
            <Sparkles className="w-4 h-4 text-amber-300 mr-1.5" />
            <span>Click &amp; See</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="dev-panel-toggle-btn"
          title="Toggle testing controls"
          aria-expanded={isOpen}
        >
          <Wrench className="w-4 h-4 text-amber-300 mr-1.5" />
          <span>Test Helper</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {isOpen && (
        <div className="dev-panel-content animate-fade-in">
          <div className="dev-panel-header">
            <span className="dev-current-stage">
              Active Stage: <strong>{currentStage}</strong>
            </span>
          </div>

          <p className="dev-panel-note">
            Test isolated timer transitions & celebrations:
          </p>

          <div className="dev-buttons-grid">
            {/* ============================================================== */}
            {/* PRIMARY TEST ACTIONS (MANDATORY VERIFICATION ACTIONS)          */}
            {/* ============================================================== */}

            {/* Test Option A: Cover Timer Test */}
            <button
              type="button"
              onClick={onTestCoverTimer}
              className="dev-action-btn test-cover-timer-btn"
              title="Simulate Timer 1 reaching zero: Navigates to Firecracker page with Timer 2 visible and NO fireworks"
            >
              <ArrowRight className="w-3.5 h-3.5 mr-1 text-sky-400" />
              <span>Test Timer 1 (Cover → Firecracker)</span>
            </button>

            {/* Test Option B: Firecracker Timer Test */}
            <button
              type="button"
              onClick={onTestFirecrackerTimer}
              className="dev-action-btn test-firecracker-timer-btn"
              title="Simulate Timer 2 reaching zero: Launches colorful crackers/fireworks. First heart click forms HAPPY BIRTHDAY, second click opens Main page"
            >
              <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span>Test Timer 2 (Firecracker Crackers)</span>
            </button>

            {/* ============================================================== */}
            {/* OPTIONAL LIVE 5-SECOND COUNTDOWN TESTS                         */}
            {/* ============================================================== */}
            <button
              type="button"
              onClick={onTriggerCover5sCountdown}
              className="dev-action-btn test-timer-btn"
              title="Start 5-second countdown on Cover page"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              <span>5s Countdown: Cover Timer</span>
            </button>

            <button
              type="button"
              onClick={onTriggerFirecracker5sCountdown}
              className="dev-action-btn test-timer-btn"
              title="Start 5-second countdown on Firecracker wall"
            >
              <Play className="w-3.5 h-3.5 mr-1 text-amber-300" />
              <span>5s Countdown: Firecracker Timer</span>
            </button>

            {/* ============================================================== */}
            {/* DIRECT SECTION PREVIEWS                                        */}
            {/* ============================================================== */}
            <button
              type="button"
              onClick={onJumpToCountdown}
              className={`dev-action-btn countdown-btn ${currentStage === 'countdown' ? 'is-active' : ''}`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>1. Blurred Countdown Page</span>
            </button>

            <button
              type="button"
              onClick={onJumpToFireworksPage}
              className={`dev-action-btn fireworks-btn ${currentStage === 'fireworks' ? 'is-active' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>2. Firecracker Page (Idle)</span>
            </button>

            <button
              type="button"
              onClick={onJumpToMainPage}
              className={`dev-action-btn mainpage-btn ${currentStage === 'main' ? 'is-active' : ''}`}
            >
              <Heart className="w-3.5 h-3.5 mr-1" />
              <span>3. Main Birthday Page</span>
            </button>

            {onJumpToSadMemories && (
              <button
                type="button"
                onClick={onJumpToSadMemories}
                className={`dev-action-btn memories-btn ${currentStage === 'sad-memories' ? 'is-active' : ''}`}
              >
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                <span>4. Sad Image Gallery</span>
              </button>
            )}

            {onJumpToHappyGallery && (
              <button
                type="button"
                onClick={onJumpToHappyGallery}
                className={`dev-action-btn happy-gallery-btn ${currentStage === 'happy-gallery' ? 'is-active' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
                <span>5. Happy Gallery</span>
              </button>
            )}

            {onJumpToQnA && (
              <button
                type="button"
                onClick={onJumpToQnA}
                className={`dev-action-btn qna-btn ${currentStage === 'qna' ? 'is-active' : ''}`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-rose-300" />
                <span>6. Q&amp;A Section</span>
              </button>
            )}

            {/* Reset to Clean Config */}
            <button
              type="button"
              onClick={onResetToDefaultConfig}
              className="dev-action-btn reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset to Clean Config</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
