import React, { useState, useCallback } from 'react';
import BirthdayCountdownPage from './components/BirthdayCountdownPage';
import CoverPage from './components/CoverPage';
import MainPage from './components/MainPage';
import SadMemoriesGallery from './components/SadMemoriesGallery';
import DevControls from './components/DevControls';
import { BIRTHDAY_CONFIG } from './config';

/**
 * Main Application Orchestrator
 * Strictly maintains the 3-stage flow with two completely independent timers:
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
 * - Main page and Sad Memories gallery flow proceed seamlessly.
 */
export default function App() {
  // Stage state: 'countdown' | 'fireworks' | 'main' | 'sad-memories'
  const [stage, setStage] = useState('countdown');

  // Signal to trigger fireworks celebration on Firecracker page (0 = idle, >0 = celebrate)
  const [celebrationSignal, setCelebrationSignal] = useState(0);

  // Timer 1: Cover / Blurred Countdown Page Target Date
  const [coverTargetDate, setCoverTargetDate] = useState(
    BIRTHDAY_CONFIG.coverTargetDate || BIRTHDAY_CONFIG.targetDate || null
  );

  // Timer 2: Firecracker / Rooftop Page Target Date
  const [firecrackerTargetDate, setFirecrackerTargetDate] = useState(
    BIRTHDAY_CONFIG.firecrackerTargetDate || BIRTHDAY_CONFIG.targetDate || null
  );

  // ---------------------------------------------------------------------------
  // 1. STRICTLY SEPARATED HANDLERS
  // ---------------------------------------------------------------------------

  // Handler 1: Cover Timer Complete -> ONLY navigates to Firecracker page
  const handleCoverTimerComplete = useCallback(() => {
    setCelebrationSignal(0);
    setStage('fireworks');
  }, []);

  // Handler 2: Firecracker Timer Complete -> ONLY starts fireworks celebration
  const handleFirecrackerTimerComplete = useCallback(() => {
    setStage('fireworks');
    setCelebrationSignal((prev) => prev + 1);
  }, []);

  // Handler 3: Heart Button Click -> ONLY navigates to Main Birthday Page after celebration
  const handleHeartButtonClick = useCallback(() => {
    setStage('main');
  }, []);

  // Open Sad Memories Gallery from Main Page
  const handleOpenSadMemories = useCallback(() => {
    setStage('sad-memories');
  }, []);

  // Return from Sad Memories Gallery to Main Page
  const handleBackFromSadMemories = useCallback(() => {
    setStage('main');
  }, []);

  // Replay from start
  const handleReplay = useCallback(() => {
    setCelebrationSignal(0);
    setStage('countdown');
  }, []);

  // ---------------------------------------------------------------------------
  // 2. DEV TEST HELPER ACTIONS (STRICTLY ISOLATED)
  // ---------------------------------------------------------------------------

  // Test Option A: Cover Timer Test (Simulates Timer 1 reaching zero)
  // Action: Cover -> Firecracker page. Timer 2 visible in normal state; zero fireworks.
  const handleTestCoverTimer = useCallback(() => {
    handleCoverTimerComplete();
  }, [handleCoverTimerComplete]);

  // Test Option B: Firecracker Timer Test (Simulates Timer 2 reaching zero)
  // Action: Launches colorful crackers/fireworks in open sky, heart button active, waits for 1st click (Happy Birthday) and 2nd click (Main page)
  const handleTestFirecrackerTimer = useCallback(() => {
    handleFirecrackerTimerComplete();
  }, [handleFirecrackerTimerComplete]);

  // Direct section previews
  const handleJumpToCountdown = useCallback(() => {
    setCelebrationSignal(0);
    setStage('countdown');
  }, []);

  const handleJumpToFireworksPage = useCallback(() => {
    setCelebrationSignal(0);
    setStage('fireworks');
  }, []);

  const handleJumpToMainPage = useCallback(() => {
    setStage('main');
  }, []);

  const handleJumpToSadMemories = useCallback(() => {
    setStage('sad-memories');
  }, []);

  // Live 5s Countdown Tests
  const handleTriggerCover5sCountdown = useCallback(() => {
    setStage('countdown');
    const future = new Date(Date.now() + (BIRTHDAY_CONFIG.dev.testCountdownDurationSeconds || 5) * 1000);
    setCoverTargetDate(future.toISOString());
  }, []);

  const handleTriggerFirecracker5sCountdown = useCallback(() => {
    setStage('fireworks');
    setCelebrationSignal(0);
    const future = new Date(Date.now() + (BIRTHDAY_CONFIG.dev.testCountdownDurationSeconds || 5) * 1000);
    setFirecrackerTargetDate(future.toISOString());
  }, []);

  // Reset to Clean Config
  const handleResetToDefaultConfig = useCallback(() => {
    setCoverTargetDate(BIRTHDAY_CONFIG.coverTargetDate || BIRTHDAY_CONFIG.targetDate || null);
    setFirecrackerTargetDate(BIRTHDAY_CONFIG.firecrackerTargetDate || BIRTHDAY_CONFIG.targetDate || null);
    setCelebrationSignal(0);
    setStage('countdown');
  }, []);

  return (
    <div className="surprise-app-container">
      {/* Dev helper toggle */}
      <DevControls
        currentStage={stage}
        onTestCoverTimer={handleTestCoverTimer}
        onTestFirecrackerTimer={handleTestFirecrackerTimer}
        onJumpToCountdown={handleJumpToCountdown}
        onJumpToFireworksPage={handleJumpToFireworksPage}
        onJumpToMainPage={handleJumpToMainPage}
        onJumpToSadMemories={handleJumpToSadMemories}
        onTriggerCover5sCountdown={handleTriggerCover5sCountdown}
        onTriggerFirecracker5sCountdown={handleTriggerFirecracker5sCountdown}
        onResetToDefaultConfig={handleResetToDefaultConfig}
      />

      {/* STAGE 1: Blurred Countdown / Cover Page (Timer 1) */}
      {stage === 'countdown' && (
        <BirthdayCountdownPage
          targetDate={coverTargetDate}
          onCountdownComplete={handleCoverTimerComplete}
        />
      )}

      {/* STAGE 2: Firecracker & Rooftop Fireworks Page (Timer 2) */}
      {stage === 'fireworks' && (
        <CoverPage
          targetDate={firecrackerTargetDate}
          celebrationSignal={celebrationSignal}
          onProceedToMain={handleHeartButtonClick}
        />
      )}

      {/* STAGE 3: Main Birthday Page */}
      {stage === 'main' && (
        <MainPage
          onReplay={handleReplay}
          onOpenMemories={handleOpenSadMemories}
        />
      )}

      {/* STAGE 4: Sad Image Gallery */}
      {stage === 'sad-memories' && (
        <SadMemoriesGallery onBack={handleBackFromSadMemories} />
      )}
    </div>
  );
}
