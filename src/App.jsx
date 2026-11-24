import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import BirthdayCountdownPage from './components/BirthdayCountdownPage';
import CoverPage from './components/CoverPage';
import MainPage from './components/MainPage';
import SadMemoriesGallery from './components/SadMemoriesGallery';
import HappyMemoriesGallery from './components/HappyMemoriesGallery';
import QnASection from './components/QnASection';
import MobileInfoScreen from './components/MobileInfoScreen';
import SeeThisView from './components/SeeThisView';
import ErrorBoundary from './components/ErrorBoundary';
import { BIRTHDAY_CONFIG, parseISTTarget } from './config';
import { isMobileOrTabletDevice } from './utils/deviceDetector';
import { audioController } from './utils/audioController';

/**
 * Main Application Orchestrator
 * Strictly maintains the original website flow with two completely independent timers:
 * 
 * STAGE 1 — COVER PAGE (BirthdayCountdownPage)
 * - Timer 1 belongs only to the cover countdown page (`coverTargetDate`).
 * - When Timer 1 reaches zero -> navigates to Firecracker page (`stage = 'fireworks'`).
 * - Shows Firecracker page with Timer 2 in normal countdown state.
 * - Does NOT launch fireworks; does NOT display HAPPY BIRTHDAY; does NOT navigate to main page.
 * 
 * STAGE 2 — FIRECRACKER PAGE (CoverPage)
 * - Timer 2 belongs only to the Firecracker page (`firecrackerTargetDate`).
 * - When Timer 2 reaches zero -> launches colorful crackers/fireworks in open sky.
 * - Does NOT form or display HAPPY BIRTHDAY at this stage!
 * - Heart button appears / becomes active in the animation.
 * 
 * STAGE 3 — FIRST HEART CLICK
 * - Starts particle-based "HAPPY BIRTHDAY" animation.
 * - Completed message holds indefinitely in the sky.
 * - Does NOT navigate to main page.
 * 
 * STAGE 4 — SECOND HEART CLICK
 * - Smoothly navigates to Main Birthday Page (`MainPage`).
 * - Main page, Sad Memories gallery, Happy Gallery, and Q&A flow proceed in intended order.
 */
export default function App() {
  // Mobile & tablet device detection state (survives reload, refresh, navigation)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => isMobileOrTabletDevice());

  useEffect(() => {
    const handleDeviceCheck = () => {
      setIsMobileOrTablet(isMobileOrTabletDevice());
    };
    window.addEventListener('resize', handleDeviceCheck);
    window.addEventListener('orientationchange', handleDeviceCheck);
    return () => {
      window.removeEventListener('resize', handleDeviceCheck);
      window.removeEventListener('orientationchange', handleDeviceCheck);
    };
  }, []);

  // Helper to parse and calculate IST target
  const getInitialCoverTarget = () => {
    const oc = BIRTHDAY_CONFIG.openingCountdown;
    if (oc && (oc.targetDate || oc.targetTime)) {
      const ms = parseISTTarget(oc.targetDate, oc.targetTime);
      if (ms) return new Date(ms).toISOString();
    }
    return BIRTHDAY_CONFIG.coverTargetDate || BIRTHDAY_CONFIG.targetDate || null;
  };

  const getInitialFirecrackerTarget = () => {
    const sc = BIRTHDAY_CONFIG.secondCountdown;
    if (sc && (sc.targetDate || sc.targetTime)) {
      const ms = parseISTTarget(sc.targetDate, sc.targetTime);
      if (ms) return new Date(ms).toISOString();
    }
    return BIRTHDAY_CONFIG.firecrackerTargetDate || BIRTHDAY_CONFIG.targetDate || null;
  };

  // Compute initial stage & celebration signal based on actual current IST time vs. config.js countdowns
  const computeInitialExperienceState = () => {
    // Purge any residual Teleport-specific storage keys
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('TELEPORT_24H_NAV_state');
        localStorage.removeItem('TELEPORT_24H_NAV_enabled');
        localStorage.removeItem('birthday_teleport_enabled');
      } catch (e) {
        // ignore
      }
    }

    // 1. Allow explicit dev preview stage query parameter if present (e.g. ?stage=main or ?stage=sad-memories)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get('stage') || params.get('page');
      if (stageParam && ['countdown', 'fireworks', 'main', 'sad-memories', 'happy-gallery', 'qna'].includes(stageParam)) {
        return {
          stage: stageParam,
          celebrationSignal: stageParam === 'fireworks' ? 1 : 0,
        };
      }
    }

    const now = Date.now();
    const oc = BIRTHDAY_CONFIG.openingCountdown;
    const sc = BIRTHDAY_CONFIG.secondCountdown;

    const target1 = parseISTTarget(oc?.targetDate, oc?.targetTime) || (BIRTHDAY_CONFIG.coverTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.coverTargetDate) : null);
    const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (BIRTHDAY_CONFIG.firecrackerTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.firecrackerTargetDate) : null);

    // CASE A – First countdown has NOT expired
    // If current IST time is earlier than the first countdown target:
    // - Show the Cover Page.
    // - Display the first countdown.
    // - Keep the second countdown page hidden.
    if (target1 && now < target1) {
      return { stage: 'countdown', celebrationSignal: 0 };
    }

    // CASE C – Both countdowns have expired
    // If current IST time is equal to or later than the second countdown target:
    // - Skip both countdown pages.
    // - Start the existing fireworks celebration immediately.
    // - Trigger the welcome song according to its existing audio rules.
    // - Preserve the existing heart-button sequence.
    if (target2 && now >= target2) {
      return { stage: 'fireworks', celebrationSignal: 1 };
    }

    // CASE B – First countdown HAS expired, but second countdown has NOT expired
    // If current IST time is equal to or later than the first target, but earlier than the second target:
    // - Skip the Cover Page completely.
    // - Show the Firecracker Page directly.
    // - Display the running second countdown.
    // - Do not launch fireworks until the second countdown genuinely expires.
    return { stage: 'fireworks', celebrationSignal: 0 };
  };

  const initialExperienceState = computeInitialExperienceState();

  // Primary navigation stage:
  // 'countdown'     -> Blurred countdown with password card (Timer 1)
  // 'fireworks'     -> Open-sky rooftop firecracker countdown & celebration (Timer 2)
  // 'main'          -> Main Birthday Page (Memories, cake, wishes, letters)
  // 'sad-memories'  -> Dedicated Sad Memories album gallery
  // 'happy-gallery' -> Dedicated Happy Memories sunset album gallery
  // 'qna'           -> Interactive Q&A Moments & Memories
  const [stage, setStage] = useState(initialExperienceState.stage);

  // Signal to trigger fireworks celebration on Firecracker page (0 = idle, >0 = celebrate)
  const [celebrationSignal, setCelebrationSignal] = useState(initialExperienceState.celebrationSignal);

  // Timer 1: Cover / Blurred Countdown Page Target Date (IST)
  const [coverTargetDate, setCoverTargetDate] = useState(getInitialCoverTarget);

  // Timer 2: Firecracker / Rooftop Page Target Date (IST)
  const [firecrackerTargetDate, setFirecrackerTargetDate] = useState(getInitialFirecrackerTarget);

  // Track whether the second countdown has genuinely completed and fireworks are unlocked
  const [secondCountdownCompleted, setSecondCountdownCompleted] = useState(() => {
    if (initialExperienceState.celebrationSignal > 0) return true;
    const now = Date.now();
    const sc = BIRTHDAY_CONFIG.secondCountdown;
    const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (BIRTHDAY_CONFIG.firecrackerTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.firecrackerTargetDate) : null);
    return Boolean(target2 && now >= target2);
  });

  const handleSecondCountdownComplete = useCallback(() => {
    setSecondCountdownCompleted(true);
  }, []);

  // Synchronize background music section ownership whenever the active stage changes
  useEffect(() => {
    if (stage === 'countdown') {
      audioController.setActiveSection('countdown');
    } else if (stage === 'fireworks') {
      audioController.setActiveSection('fireworks');
    } else if (stage === 'main') {
      audioController.setActiveSection('main');
    } else if (stage === 'sad-memories') {
      audioController.setActiveSection('sad');
    } else if (stage === 'happy-gallery') {
      audioController.setActiveSection('happy');
    } else if (stage === 'qna') {
      audioController.startQnaPlayback();
    }
  }, [stage]);

  // ---------------------------------------------------------------------------
  // ORIGINAL WEBSITE FLOW HANDLERS
  // ---------------------------------------------------------------------------

  // Handler 1: Cover Timer Complete -> ONLY navigates to Firecracker page
  const handleCoverTimerComplete = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    const now = Date.now();
    const sc = BIRTHDAY_CONFIG.secondCountdown;
    const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (BIRTHDAY_CONFIG.firecrackerTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.firecrackerTargetDate) : null);

    if (target2 && now >= target2) {
      setCelebrationSignal(1);
      setSecondCountdownCompleted(true);
    } else {
      setCelebrationSignal(0);
      setSecondCountdownCompleted(false);
    }
    setStage('fireworks');
    setFirecrackerTargetDate((prev) => {
      if (sc && (sc.targetDate || sc.targetTime)) {
        const ms = parseISTTarget(sc.targetDate, sc.targetTime);
        if (ms) return new Date(ms).toISOString();
      }
      return prev || null;
    });
  }, []);

  // Handler 2: Firecracker Timer Complete -> ONLY starts fireworks celebration
  const handleFirecrackerTimerComplete = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('fireworks');
    setCelebrationSignal((prev) => prev + 1);
    setSecondCountdownCompleted(true);
  }, []);

  // Handler 3: Heart Button Click -> ONLY navigates to Main Birthday Page after celebration
  const handleHeartButtonClick = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('main');
  }, []);

  // Track initial section index for Main Birthday page (0 by default)
  const [mainPageSectionIndex, setMainPageSectionIndex] = useState(0);

  const handleMainSectionChange = useCallback((index) => {
    setMainPageSectionIndex(index);
  }, []);

  // Sad Gallery state preservation (tracks view & photoIndex so returning restores state)
  const [sadGalleryState, setSadGalleryState] = useState({
    view: 'cover',
    photoIndex: 0,
  });

  const handleSadGalleryStateChange = useCallback((nextState) => {
    setSadGalleryState(nextState);
  }, []);

  // Open Sad Memories Gallery from Main Page (preserves active sad gallery position)
  const handleOpenSadMemories = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('sad-memories');
  }, []);

  // Return from Sad Memories Gallery to Main Birthday Page (preserves active section)
  const handleBackToMainLastSection = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('main');
  }, []);

  // Return from Sad Memories Gallery to Main Page
  const handleBackFromSadMemories = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('main');
  }, []);

  // Happy Gallery state preservation (tracks view & photoIndex so returning restores state)
  const [happyGalleryState, setHappyGalleryState] = useState({
    view: 'cover',
    photoIndex: 0,
  });

  const handleHappyGalleryStateChange = useCallback((nextState) => {
    setHappyGalleryState(nextState);
  }, []);

  // Open Happy Memories Gallery
  const handleOpenHappyGallery = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('happy-gallery');
  }, []);

  // Return from Happy Memories Gallery to Sad Gallery (restores previous state)
  const handleBackToSadGallery = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('sad-memories');
  }, []);

  // Return from Happy Memories Gallery to Main Page
  const handleBackFromHappyGallery = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setStage('main');
  }, []);

  // Q&A state preservation (tracks step, questionIndex, selectedOptionId, openMessage so returning restores state)
  const [qnaState, setQnaState] = useState({
    step: 'question',
    questionIndex: 0,
    selectedOptionId: null,
    openMessage: null,
  });

  const handleQnaProgressChange = useCallback((nextProgress) => {
    setQnaState((prev) => ({
      ...prev,
      ...nextProgress,
    }));
  }, []);

  // Open Q&A Section from Happy Gallery
  const handleOpenQnA = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    audioController.startQnaPlayback();
    setStage('qna');
  }, []);

  // Return from Q&A Section to Happy Gallery
  const handleBackFromQnAToHappyGallery = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    audioController.setActiveSection('happy');
    setStage('happy-gallery');
  }, []);

  // Replay from start (resets in-memory session positions back to starting defaults)
  const handleReplay = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    setCelebrationSignal(0);
    setMainPageSectionIndex(0);
    setSadGalleryState({ view: 'cover', photoIndex: 0 });
    setHappyGalleryState({ view: 'cover', photoIndex: 0 });
    setQnaState({
      step: 'question',
      questionIndex: 0,
      selectedOptionId: null,
      openMessage: null,
    });
    setStage('countdown');
  }, []);

  // "Click & See" Action:
  // Starts a 10-second countdown on the rooftop leading into the full fireworks + welcome song celebration
  // without modifying or corrupting real configured countdown targets in config.js
  const handleClickAndSee = useCallback(() => {
    try { audioController.handleUserInteraction(); } catch (_) {}
    audioController.resetWelcomeSongSession();
    setCelebrationSignal(0);
    const future = new Date(Date.now() + 10 * 1000);
    setFirecrackerTargetDate(future.toISOString());
    setStage('fireworks');
  }, []);

  // Get active stage background information for the "See This View" fullscreen background viewer
  const getActiveStageBackground = () => {
    switch (stage) {
      case 'countdown':
        return null;
      case 'fireworks':
        return {
          src: BIRTHDAY_CONFIG.cover?.backgroundImage || BIRTHDAY_CONFIG.images?.fireworksRooftopBg || '/cover.png',
          alt: 'Romantic rooftop balcony overlooking twilight sky',
        };
      case 'main':
        return {
          src: BIRTHDAY_CONFIG.images?.mainBirthdayBg || BIRTHDAY_CONFIG.images?.desktopBackground || '/background.png',
          alt: 'Sunset terrace background',
        };
      case 'sad-memories':
        return {
          src: BIRTHDAY_CONFIG.sadGallery?.background || '/sad.png',
          alt: 'Sad memories moonlit background',
        };
      case 'happy-gallery':
        return {
          src: BIRTHDAY_CONFIG.happyGallery?.background || '/happy-gallery.png',
          alt: 'Happy gallery sunset background',
        };
      case 'qna':
        return {
          src: BIRTHDAY_CONFIG.qna?.background || BIRTHDAY_CONFIG.qna?.image || BIRTHDAY_CONFIG.images?.qnaBackground || '/QNA-image.png',
          alt: 'Q&A scenic nature background',
        };
      default:
        return null;
    }
  };

  const activeStageBg = getActiveStageBackground();

  // When opened on a mobile phone or tablet, strictly display the dedicated Mobile Information Screen
  if (isMobileOrTablet) {
    return <MobileInfoScreen />;
  }

  return (
    <div className="surprise-app-container">
      {/* Top-Right Utility Cluster: Shared flex container for See This View and Click & See Magic */}
      <div className="top-right-controls-cluster">
        {stage !== 'countdown' && activeStageBg && (
          <SeeThisView
            backgroundImage={activeStageBg.src}
            alt={activeStageBg.alt}
          />
        )}

        {/* Click & See Magic: Standalone button visible ONLY after second countdown has completed */}
        {stage !== 'countdown' && secondCountdownCompleted && (
          <button
            type="button"
            onClick={handleClickAndSee}
            className="click-see-magic-btn"
            aria-label="Click & See Magic"
            title="Preview 10s countdown to full fireworks celebration"
          >
            <Sparkles className="w-4 h-4 text-amber-300 mr-1.5" />
            <span>Click &amp; See Magic</span>
          </button>
        )}
      </div>

      {/* STAGE 1: Blurred Countdown / Cover Page (Timer 1) */}
      {stage === 'countdown' && (
        <ErrorBoundary>
          <BirthdayCountdownPage
            targetDate={coverTargetDate}
            onCountdownComplete={handleCoverTimerComplete}
          />
        </ErrorBoundary>
      )}

      {/* STAGE 2: Firecracker & Rooftop Fireworks Page (Timer 2) */}
      {stage === 'fireworks' && (
        <ErrorBoundary>
          <CoverPage
            targetDate={firecrackerTargetDate}
            celebrationSignal={celebrationSignal}
            onProceedToMain={handleHeartButtonClick}
            onSecondCountdownComplete={handleSecondCountdownComplete}
          />
        </ErrorBoundary>
      )}

      {/* STAGE 3: Main Birthday Page */}
      {stage === 'main' && (
        <ErrorBoundary>
          <MainPage
            onReplay={handleReplay}
            onOpenMemories={handleOpenSadMemories}
            onOpenHappyGallery={handleOpenHappyGallery}
            initialSectionIndex={mainPageSectionIndex}
            onSectionChange={handleMainSectionChange}
          />
        </ErrorBoundary>
      )}

      {/* STAGE 4: Sad Image Gallery */}
      {stage === 'sad-memories' && (
        <ErrorBoundary>
          <SadMemoriesGallery
            onBack={handleBackToMainLastSection}
            onPreviousSection={handleBackToMainLastSection}
            onNextPage={handleOpenHappyGallery}
            initialView={sadGalleryState.view}
            initialPhotoIndex={sadGalleryState.photoIndex}
            onStateChange={handleSadGalleryStateChange}
          />
        </ErrorBoundary>
      )}

      {/* STAGE 5: Happy Memories Gallery */}
      {stage === 'happy-gallery' && (
        <ErrorBoundary>
          <HappyMemoriesGallery
            onBack={handleBackToSadGallery}
            onPreviousPage={handleBackToSadGallery}
            onNextPage={handleOpenQnA}
            initialView={happyGalleryState.view}
            initialPhotoIndex={happyGalleryState.photoIndex}
            onStateChange={handleHappyGalleryStateChange}
          />
        </ErrorBoundary>
      )}

      {/* STAGE 6: Q&A Section */}
      {stage === 'qna' && (
        <ErrorBoundary>
          <QnASection
            onPreviousPage={handleBackFromQnAToHappyGallery}
            onBackToHappyGallery={handleBackFromQnAToHappyGallery}
            initialStep={qnaState.step}
            initialQuestionIndex={qnaState.questionIndex}
            initialSelectedOptionId={qnaState.selectedOptionId}
            initialOpenMessage={qnaState.openMessage}
            onProgressChange={handleQnaProgressChange}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
