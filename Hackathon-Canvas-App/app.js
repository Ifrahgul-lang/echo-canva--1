const { useState, useEffect, useRef } = React;

function App() {
    const [selectedStyle, setSelectedStyle] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('welcome');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCreateNewModal, setShowCreateNewModal] = useState(false);
    const [updateMode, setUpdateMode] = useState(null);
    const [userInstruction, setUserInstruction] = useState('');
    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: "Hello! I'm your art companion. I can describe your artwork, help you update it, or just chat about your creation. What would you like to explore?", type: 'ai' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [artDescription, setArtDescription] = useState('');
    const [shareLink, setShareLink] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceCommand, setVoiceCommand] = useState('');
    const [showVoiceIndicator, setShowVoiceIndicator] = useState(false);
    const [hoveredStyle, setHoveredStyle] = useState(null);
    const [autoSelectingStyle, setAutoSelectingStyle] = useState(null);
    const [showGestureOverlay, setShowGestureOverlay] = useState(false);
    const [showTapGestureIndicator, setShowTapGestureIndicator] = useState(false);
    const [audioMenuActive, setAudioMenuActive] = useState(false);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [tapCount, setTapCount] = useState(0);
    const [createNewHoverTimer, setCreateNewHoverTimer] = useState(null);
    const [voiceCommandsActive, setVoiceCommandsActive] = useState(true);
    const [isRecordingInstruction, setIsRecordingInstruction] = useState(false);
    const [instructionRecordingTime, setInstructionRecordingTime] = useState(0);
    const [capturedInstruction, setCapturedInstruction] = useState('');
    const [instructionMethod, setInstructionMethod] = useState('text');
    const [voiceCommandActive, setVoiceCommandActive] = useState(null);
    
    const mainHeadingRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const audioContextRef = useRef(null);
    const chatInputRef = useRef(null);
    const speechSynthesisRef = useRef(null);
    const recognitionRef = useRef(null);
    const instructionRecognitionRef = useRef(null);
    const hoverTimerRef = useRef(null);
    const autoSelectTimerRef = useRef(null);
    const recordingOscillatorRef = useRef(null);
    const tapTimerRef = useRef(null);
    const artDisplayRef = useRef(null);
    const recordingStartTimeRef = useRef(0);
    const createNewButtonRef = useRef(null);
    const instructionRecordingTimerRef = useRef(null);
    const textInputRef = useRef(null);
    const tryAgainButtonRef = useRef(null);
    const addInstructionButtonRef = useRef(null);
    const startNewButtonRef = useRef(null);

    // Initialize app
    useEffect(() => {
        const welcomeTimer = setTimeout(() => {
            setCurrentScreen('selection');
        }, 1800);

        const loadTimer = setTimeout(() => {
            setIsLoaded(true);
        }, 300);

        // Initialize audio context for accessibility and recording feedback
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported');
        }

        // Initialize speech synthesis
        speechSynthesisRef.current = window.speechSynthesis;

        // Initialize voice recognition automatically
        initializeVoiceRecognition();
        startVoiceRecognition();

        return () => {
            clearTimeout(welcomeTimer);
            clearTimeout(loadTimer);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (speechSynthesisRef.current) {
                speechSynthesisRef.current.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (instructionRecognitionRef.current) {
                instructionRecognitionRef.current.stop();
            }
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
            if (autoSelectTimerRef.current) {
                clearTimeout(autoSelectTimerRef.current);
            }
            if (recordingOscillatorRef.current) {
                recordingOscillatorRef.current.stop();
            }
            if (tapTimerRef.current) {
                clearTimeout(tapTimerRef.current);
            }
            if (createNewHoverTimer) {
                clearTimeout(createNewHoverTimer);
            }
            if (instructionRecordingTimerRef.current) {
                clearInterval(instructionRecordingTimerRef.current);
            }
        };
    }, []);

    // Auto-describe artwork when reveal screen loads
    useEffect(() => {
        if (currentScreen === 'reveal' && !artDescription) {
            const autoDescribeTimer = setTimeout(() => {
                autoDescribeArtwork();
            }, 1000);
            
            return () => clearTimeout(autoDescribeTimer);
        }
    }, [currentScreen, artDescription]);

    // Initialize voice recognition
    const initializeVoiceRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setShowVoiceIndicator(true);
                playAccessibilityTone(523.25, 0.3);
                if (currentScreen === 'selection' && !showUpdateModal && !showCreateNewModal) {
                    speakText("Voice commands activated. Say 'default style' or 'accessible style' to choose.");
                }
            };

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setVoiceCommand(interimTranscript || finalTranscript);
                
                if (finalTranscript) {
                    console.log('Processing voice command:', finalTranscript);
                    processVoiceCommand(finalTranscript.toLowerCase());
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.log('Speech recognition error', event.error);
                setIsListening(false);
                setShowVoiceIndicator(false);
                setTimeout(() => {
                    if (currentScreen !== 'welcome' && voiceCommandsActive) {
                        startVoiceRecognition();
                    }
                }, 1000);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setShowVoiceIndicator(false);
                setTimeout(() => {
                    if (currentScreen !== 'welcome' && voiceCommandsActive) {
                        startVoiceRecognition();
                    }
                }, 500);
            };
        } else {
            console.log('Speech recognition not supported');
            setChatMessages(prev => [...prev, 
                { id: Date.now(), text: "Voice recognition is not supported in your browser. Please use Chrome or Edge for voice commands.", type: 'ai' }
            ]);
        }
    };

    // Initialize instruction voice recognition (separate instance)
    const initializeInstructionRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            instructionRecognitionRef.current = new SpeechRecognition();
            
            instructionRecognitionRef.current.continuous = true;
            instructionRecognitionRef.current.interimResults = true;
            instructionRecognitionRef.current.lang = 'en-US';

            instructionRecognitionRef.current.onstart = () => {
                console.log('Instruction recording started');
                setCapturedInstruction('');
            };

            instructionRecognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (interimTranscript || finalTranscript) {
                    setCapturedInstruction(interimTranscript || finalTranscript);
                }
            };

            instructionRecognitionRef.current.onerror = (event) => {
                console.log('Instruction recording error', event.error);
            };

            instructionRecognitionRef.current.onend = () => {
                console.log('Instruction recording ended');
                if (isRecordingInstruction) {
                    setTimeout(() => {
                        if (isRecordingInstruction) {
                            instructionRecognitionRef.current.start();
                        }
                    }, 100);
                }
            };
        }
    };

    // Play recording start tone (rising tone)
    const playRecordingStartTone = () => {
        if (!audioContextRef.current) return;
        
        try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.setValueAtTime(220, audioContextRef.current.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContextRef.current.currentTime + 1.5);
            
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime + 1.4);
            gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 1.5);
            
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + 1.5);
            
            recordingOscillatorRef.current = oscillator;
        } catch (e) {
            console.log('Recording tone playback error');
        }
    };

    // Play recording stop tone (falling tone)
    const playRecordingStopTone = () => {
        if (!audioContextRef.current) return;
        
        try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.setValueAtTime(660, audioContextRef.current.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(220, audioContextRef.current.currentTime + 0.8);
            
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime + 0.7);
            gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.8);
            
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + 0.8);
        } catch (e) {
            console.log('Recording stop tone playback error');
        }
    };

    // Process voice commands - FIXED VERSION with screen-specific commands
    const processVoiceCommand = (command) => {
        console.log('Processing voice command:', command, 'on screen:', currentScreen);
        
        // Handle instruction recording mode - HIGHEST PRIORITY
        if (isRecordingInstruction) {
            console.log('Currently recording instruction, processing command:', command);
            if (command.includes('stop') || command.includes('finish') || command.includes('done')) {
                stopInstructionRecording();
                return;
            } else if (command.includes('cancel') || command.includes('back')) {
                cancelInstructionRecording();
                return;
            }
            return;
        }

        // Handle Create New Modal voice commands
        if (showCreateNewModal) {
            console.log('Create New Modal is open, processing command:', command);
            if (command.includes('try new') || command.includes('new artwork') || command.includes('first') || command.includes('one') || command.includes('1')) {
                tryNewArtwork();
                return;
            } else if (command.includes('add instruction') || command.includes('instruction') || command.includes('second') || command.includes('two') || command.includes('2')) {
                addNewInstruction();
                return;
            } else if (command.includes('start fresh') || command.includes('fresh') || command.includes('third') || command.includes('three') || command.includes('3')) {
                restartFlow();
                return;
            } else if (command.includes('cancel') || command.includes('back') || command.includes('close')) {
                setShowCreateNewModal(false);
                speakText("Closed create new options.");
                return;
            }
        }

        // Handle Update Modal voice commands
        if (showUpdateModal) {
            console.log('Update Modal is open, processing command:', command);
            if (command.includes('try again') || command.includes('try') || command.includes('same sound') || command.includes('first') || command.includes('1')) {
                tryAgain();
                return;
            } else if (command.includes('add instruction') || command.includes('instruction') || command.includes('guide') || command.includes('second') || command.includes('2')) {
                addInstruction();
                return;
            } else if (command.includes('cancel') || command.includes('back') || command.includes('close')) {
                setShowUpdateModal(false);
                setUpdateMode(null);
                speakText("Closed update options.");
                return;
            }
        }
        
        // SCREEN-SPECIFIC COMMANDS - Only process commands relevant to current screen
        if (currentScreen === 'selection') {
            if (command.includes('default') || command.includes('normal') || command.includes('standard') || command.includes('first') || command.includes('1')) {
                handleStyleSelect('Default Style');
                return;
            } else if (command.includes('accessible') || command.includes('high contrast') || command.includes('contrast') || command.includes('second') || command.includes('2')) {
                handleStyleSelect('Accessible Style');
                return;
            } else if (command.includes('help') || command.includes('what can i say')) {
                speakText("On the selection screen, say 'default style' or 'accessible style' to choose your visual style. You can also hover over any style for 2 seconds to automatically select it.");
                return;
            }
        } 
        else if (currentScreen === 'creation') {
            if (command.includes('start recording') || command.includes('start') || command.includes('begin recording') || command.includes('begin')) {
                if (!isRecording) {
                    startRecording();
                }
                return;
            } else if (command.includes('stop recording') || command.includes('stop') || command.includes('end recording') || command.includes('end') || command.includes('finish')) {
                if (isRecording) {
                    stopRecording();
                }
                return;
            } else if (command.includes('stop when i leave') || command.includes('stop when i leave the orb') || command.includes('stop when leaving') || command.includes('leave to stop')) {
                if (isRecording) {
                    speakText("Recording will stop automatically when you leave the orb area. You can also say 'stop recording' at any time.");
                }
                return;
            } else if (command.includes('back') || command.includes('return') || command.includes('go back')) {
                goBackToSelection();
                return;
            } else if (command.includes('help') || command.includes('what can i say')) {
                speakText("On the creation screen, say 'start recording' to begin, 'stop recording' to finish, or 'back' to return to style selection.");
                return;
            }
        } 
        else if (currentScreen === 'reveal') {
            if (command.includes('back') || command.includes('return') || command.includes('go back')) {
                if (showUpdateModal) {
                    setShowUpdateModal(false);
                    setUpdateMode(null);
                    speakText("Returned to artwork view.");
                }
                return;
            } else if (command.includes('create') || command.includes('make') || command.includes('new')) {
                showCreateNewOptions();
                return;
            } else if (command.includes('describe') || command.includes('tell me about') || command.includes('what is this') || command.includes('three') || command.includes('3')) {
                handleActionSelection(3);
                return;
            } else if (command.includes('update') || command.includes('change') || command.includes('modify') || command.includes('one') || command.includes('1')) {
                handleActionSelection(1);
                return;
            } else if (command.includes('share') || command.includes('link') || command.includes('copy') || command.includes('two') || command.includes('2')) {
                handleActionSelection(2);
                return;
            } else if (command.includes('menu') || command.includes('options') || command.includes('help')) {
                playAudioMenu();
                return;
            } else if (command.includes('help') || command.includes('what can i say')) {
                speakText("On the artwork screen, say 'update art', 'share link', 'describe again', or 'create new'. You can also tap once, twice, or three times for quick actions.");
                return;
            }
        }

        // If no specific command matched, show screen-specific help
        console.log('No specific command matched, showing screen-specific help');
        if (currentScreen === 'reveal') {
            speakText("I didn't understand that command. Say 'update art', 'share link', 'describe again', or 'create new'. Or say 'help' for more options.");
        } else if (currentScreen === 'selection') {
            speakText("Say 'default style' or 'accessible style' to choose your visual style. Say 'help' for more information.");
        } else if (currentScreen === 'creation') {
            speakText("Say 'start recording' to begin, 'stop recording' to finish, or 'back' to return. Say 'help' for more options.");
        }
    };

    // Start instruction recording
    const startInstructionRecording = () => {
        setIsRecordingInstruction(true);
        setInstructionRecordingTime(0);
        setCapturedInstruction('');
        playRecordingStartTone();
        
        initializeInstructionRecognition();
        if (instructionRecognitionRef.current) {
            instructionRecognitionRef.current.start();
        }
        
        let time = 0;
        instructionRecordingTimerRef.current = setInterval(() => {
            time += 0.1;
            setInstructionRecordingTime(parseFloat(time.toFixed(1)));
        }, 100);
        
        speakText("Recording started. Please speak your instruction for the artwork. Say 'stop' when you're finished.");
    };

    // Stop instruction recording
    const stopInstructionRecording = () => {
        setIsRecordingInstruction(false);
        if (instructionRecordingTimerRef.current) {
            clearInterval(instructionRecordingTimerRef.current);
        }
        if (instructionRecognitionRef.current) {
            instructionRecognitionRef.current.stop();
        }
        playRecordingStopTone();
        
        if (capturedInstruction.trim()) {
            speakText(`Instruction recorded: "${capturedInstruction}". Processing your artwork update.`);
            submitInstruction();
        } else {
            speakText("No instruction detected. Please try again.");
            setTimeout(() => {
                startInstructionRecording();
            }, 2000);
        }
    };

    // Cancel instruction recording
    const cancelInstructionRecording = () => {
        setIsRecordingInstruction(false);
        if (instructionRecordingTimerRef.current) {
            clearInterval(instructionRecordingTimerRef.current);
        }
        if (instructionRecognitionRef.current) {
            instructionRecognitionRef.current.stop();
        }
        setCapturedInstruction('');
        setUpdateMode(null);
        speakText("Instruction recording cancelled.");
    };

    // Handle action selection from audio menu or tap gestures
    const handleActionSelection = (actionNumber) => {
        console.log('Action selected:', actionNumber);
        setAudioMenuActive(false);
        setShowTapGestureIndicator(false);
        
        switch(actionNumber) {
            case 1:
                updateArt();
                break;
            case 2:
                generateShareLink();
                break;
            case 3:
                describeArtwork();
                break;
            default:
                break;
        }
        
        playAccessibilityTone(523.25, 0.3);
    };

    // Start voice recognition
    const startVoiceRecognition = () => {
        if (recognitionRef.current && !isListening && voiceCommandsActive) {
            try {
                recognitionRef.current.start();
                console.log('Voice recognition started');
            } catch (error) {
                console.log('Voice recognition start error:', error);
                setTimeout(() => {
                    if (voiceCommandsActive) {
                        startVoiceRecognition();
                    }
                }, 1000);
            }
        }
    };

    // Stop voice recognition
    const stopVoiceRecognition = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            console.log('Voice recognition stopped');
        }
    };

    // Handle style hover with automatic selection
    const handleStyleHover = (style, isHovering) => {
        if (isHovering) {
            setHoveredStyle(style);
            
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
            if (autoSelectTimerRef.current) {
                clearTimeout(autoSelectTimerRef.current);
            }
            
            hoverTimerRef.current = setTimeout(() => {
                if (style === 'Default Style') {
                    speakText("Default Style. For a full spectrum of colors and artistic nuance. Automatically selecting in 2 seconds.");
                } else if (style === 'Accessible Style') {
                    speakText("Accessible Style. Designed with high contrast for visual clarity. Automatically selecting in 2 seconds.");
                }
                
                autoSelectTimerRef.current = setTimeout(() => {
                    setAutoSelectingStyle(style);
                    speakText(`Selected ${style}. Moving to creation screen.`);
                    
                    setTimeout(() => {
                        handleStyleSelect(style);
                    }, 1500);
                    
                }, 2000);
                
            }, 500);
        } else {
            setHoveredStyle(null);
            setAutoSelectingStyle(null);
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
            }
            if (autoSelectTimerRef.current) {
                clearTimeout(autoSelectTimerRef.current);
            }
            if (speechSynthesisRef.current) {
                speechSynthesisRef.current.cancel();
            }
        }
    };

    // Handle Create New button hover
    const handleCreateNewHover = (isHovering) => {
        if (isHovering && currentScreen === 'reveal') {
            if (createNewHoverTimer) {
                clearTimeout(createNewHoverTimer);
            }
            
            const timer = setTimeout(() => {
                showCreateNewOptions();
                speakText("Automatically opening create new options.");
            }, 2000);
            
            setCreateNewHoverTimer(timer);
        } else {
            if (createNewHoverTimer) {
                clearTimeout(createNewHoverTimer);
                setCreateNewHoverTimer(null);
            }
        }
    };

    // Handle button voice command activation
    const handleButtonVoiceCommand = (buttonType) => {
        setVoiceCommandActive(buttonType);
        playAccessibilityTone(392, 0.3);
        
        let commandText = '';
        switch(buttonType) {
            case 'tryAgain':
                commandText = "Try Again";
                break;
            case 'addInstruction':
                commandText = "Add Instruction";
                break;
            case 'startNew':
                commandText = "Start Fresh";
                break;
            default:
                commandText = "this option";
        }
        
        speakText(`Voice command activated for ${commandText}. Say "yes" to confirm or "no" to cancel.`);
        
        const originalOnResult = recognitionRef.current.onresult;
        let confirmationReceived = false;
        
        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                const command = finalTranscript.toLowerCase();
                if (command.includes('yes') || command.includes('confirm') || command.includes('ok') || command.includes('do it')) {
                    if (!confirmationReceived) {
                        confirmationReceived = true;
                        switch(buttonType) {
                            case 'tryAgain':
                                tryAgain();
                                break;
                            case 'addInstruction':
                                addInstruction();
                                break;
                            case 'startNew':
                                restartFlow();
                                break;
                        }
                        speakText("Action confirmed. Executing now.");
                    }
                } else if (command.includes('no') || command.includes('cancel') || command.includes('stop')) {
                    if (!confirmationReceived) {
                        confirmationReceived = true;
                        speakText("Action cancelled.");
                    }
                }
                
                setTimeout(() => {
                    recognitionRef.current.onresult = originalOnResult;
                    setVoiceCommandActive(null);
                }, 100);
            }
        };
        
        setTimeout(() => {
            if (!confirmationReceived) {
                recognitionRef.current.onresult = originalOnResult;
                setVoiceCommandActive(null);
                speakText("Voice command timed out. Please try again.");
            }
        }, 5000);
    };

    // Accessibility tone player
    const playAccessibilityTone = (frequency = 440, duration = 0.4) => {
        if (!audioContextRef.current) return;
        
        try {
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.08, audioContextRef.current.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + duration);
            
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + duration);
        } catch (e) {
            console.log('Audio playback error');
        }
    };

    // Text-to-speech function
    const speakText = (text, rate = 0.9) => {
        if (!speechSynthesisRef.current) return;
        
        speechSynthesisRef.current.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        const voices = speechSynthesisRef.current.getVoices();
        const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.localService === false
        );
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        speechSynthesisRef.current.speak(utterance);
    };

    // Handle style selection
    const handleStyleSelect = (style) => {
        setSelectedStyle(style);
        playAccessibilityTone(523.25, 0.5);
        
        if (style === 'Default Style') {
            document.body.className = 'antialiased selected-default';
        } else if (style === 'Accessible Style') {
            document.body.className = 'antialiased selected-accessible';
        }
        
        setTimeout(() => {
            setCurrentScreen('creation');
        }, 400);
    };

    // Recording functions
    const startRecording = () => {
        setIsRecording(true);
        setShowGestureOverlay(true);
        playRecordingStartTone();
        recordingStartTimeRef.current = Date.now();
        
        setVoiceCommandsActive(true);
        startVoiceRecognition();
        
        speakText("Recording started. You can now use voice commands. Say 'stop recording' to finish.");
        
        let time = 0;
        recordingTimerRef.current = setInterval(() => {
            time += 0.1;
            setRecordingTime(parseFloat(time.toFixed(1)));
        }, 100);
    };

    const stopRecording = () => {
        setIsRecording(false);
        setShowGestureOverlay(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
        playRecordingStopTone();
        
        speakText("Recording stopped. Processing your sound into artwork.");
        
        setIsProcessing(true);
        
        const processingMessages = [
            "Analyzing your sound frequencies...",
            "Converting audio to visual patterns...",
            "Applying artistic style transformations...",
            "Finalizing your unique artwork..."
        ];
        
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            if (messageIndex < processingMessages.length) {
                setChatMessages(prev => [...prev, 
                    { id: Date.now() + messageIndex, text: processingMessages[messageIndex], type: 'ai' }
                ]);
                messageIndex++;
            } else {
                clearInterval(messageInterval);
                
                setTimeout(() => {
                    setIsProcessing(false);
                    setCurrentScreen('reveal');
                }, 2000);
            }
        }, 1500);
    };

    // Event handlers for gesture-based recording
    const handleRecordingStart = (event) => {
        event.preventDefault();
        if (!isRecording) {
            startRecording();
        }
    };

    const handleRecordingEnd = () => {
        if (isRecording) {
            stopRecording();
        }
    };

    // Handle mouse leaving the orb area
    const handleOrbMouseLeave = () => {
        if (isRecording) {
            speakText("Left orb area. Stopping recording automatically.");
            stopRecording();
        }
    };

    // Handle keyboard events for recording (accessibility)
    const handleKeyDown = (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !isRecording) {
            event.preventDefault();
            startRecording();
        }
    };

    const handleKeyUp = (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && isRecording) {
            event.preventDefault();
            stopRecording();
        }
    };

    // Fixed tap gesture handler for reveal screen
    const handleRevealScreenTap = (event) => {
        if (currentScreen !== 'reveal') return;
        
        const createNewButton = createNewButtonRef.current;
        if (createNewButton && createNewButton.contains(event.target)) {
            return;
        }
        
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - lastTapTime;
        
        if (timeSinceLastTap > 500) {
            setTapCount(0);
        }
        
        const newTapCount = tapCount + 1;
        setTapCount(newTapCount);
        setLastTapTime(currentTime);
        
        setShowTapGestureIndicator(true);
        if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current);
        }
        tapTimerRef.current = setTimeout(() => {
            if (newTapCount === 1) {
                handleActionSelection(1);
            } else if (newTapCount === 2) {
                handleActionSelection(2);
            } else if (newTapCount >= 3) {
                handleActionSelection(3);
                setTapCount(0);
            }
            
            setTimeout(() => {
                setShowTapGestureIndicator(false);
            }, 1000);
        }, 300);
    };

    // Auto-describe artwork function
    const autoDescribeArtwork = () => {
        const description = `Your artwork has been created in the ${selectedStyle} style. It features flowing patterns of color that represent the ${recordingTime} second sound recording. The composition shows harmonious blends of digital brushstrokes creating an abstract visual symphony with vibrant ${selectedStyle === 'Default Style' ? 'purple and blue gradients' : 'high contrast patterns'} that dance across the canvas.`;
        
        setArtDescription(description);
        
        setChatMessages(prev => [...prev, 
            { id: Date.now(), text: description, type: 'ai' }
        ]);
        
        speakText(description);
        
        setTimeout(() => {
            playAudioMenu();
        }, 8000);
        
        playAccessibilityTone(392, 0.6);
    };

    // Play audio menu after description
    const playAudioMenu = () => {
        setAudioMenuActive(true);
        setShowTapGestureIndicator(true);
        
        const menuText = "Description complete. What would you like to do next? Say 'One' or tap once to Update the Art. Say 'Two' or tap twice to Generate a Share Link. Say 'Three' or tap three times to hear the description again. Hover over the Create New button for 2 seconds to automatically open create options.";
        
        speakText(menuText);
        
        if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current);
        }
        tapTimerRef.current = setTimeout(() => {
            setShowTapGestureIndicator(false);
            setAudioMenuActive(false);
        }, 10000);
    };

    const goBackToSelection = () => {
        setCurrentScreen('selection');
        setSelectedStyle(null);
        document.body.className = 'antialiased';
    };

    const showCreateNewOptions = () => {
        setShowCreateNewModal(true);
        speakText("Create new options opened. Say 'Try New Artwork', 'Add Instruction', or 'Start Fresh'. Or say numbers: 'One' for Try New, 'Two' for Add Instruction, 'Three' for Start Fresh.");
    };

    const restartFlow = () => {
        setShowCreateNewModal(false);
        setCurrentScreen('selection');
        setSelectedStyle(null);
        setRecordingTime(0);
        setShowUpdateModal(false);
        setUpdateMode(null);
        setUserInstruction('');
        setChatMessages([{ id: 1, text: "Hello! I'm your art companion. I can describe your artwork, help you update it, or just chat about your creation. What would you like to explore?", type: 'ai' }]);
        setArtDescription('');
        setShareLink('');
        document.body.className = 'antialiased';
    };

    const tryNewArtwork = () => {
        setShowCreateNewModal(false);
        setIsProcessing(true);
        
        setTimeout(() => {
            setIsProcessing(false);
            setChatMessages(prev => [...prev, 
                { id: Date.now(), text: "I've created a brand new artwork for you! This one has different colors and patterns while keeping your creative essence.", type: 'ai' }
            ]);
            playAccessibilityTone(523.25, 0.4);
            speakText("Your new artwork has been created with fresh colors and patterns.");
        }, 2500);
    };

    const addNewInstruction = () => {
        setShowCreateNewModal(false);
        setUpdateMode('instruction');
        setShowUpdateModal(true);
    };

    // Reveal Screen Functions
    const describeArtwork = () => {
        const description = `Your artwork has been created in the ${selectedStyle} style. It features flowing patterns of color that represent the ${recordingTime} second sound recording. The composition shows harmonious blends of digital brushstrokes creating an abstract visual symphony with vibrant ${selectedStyle === 'Default Style' ? 'purple and blue gradients' : 'high contrast patterns'} that dance across the canvas.`;
        
        setArtDescription(description);
        
        setChatMessages(prev => [...prev, 
            { id: Date.now(), text: description, type: 'ai' }
        ]);
        
        speakText(description);
        
        playAccessibilityTone(392, 0.6);
    };

    const updateArt = () => {
        setShowUpdateModal(true);
        setUpdateMode(null);
        setUserInstruction('');
    };

    const tryAgain = () => {
        setShowUpdateModal(false);
        setUpdateMode(null);
        setUserInstruction('');
        
        setIsProcessing(true);
        
        playAccessibilityTone(523.25, 0.3);
        
        setTimeout(() => {
            setIsProcessing(false);
            setChatMessages(prev => [...prev, 
                { id: Date.now(), text: "I've created a new version of your artwork with the same sound input. The colors have evolved while maintaining the original essence.", type: 'ai' }
            ]);
            speakText("New artwork version created with evolved colors and patterns.");
            playAccessibilityTone(523.25, 0.4);
        }, 2000);
    };

    const addInstruction = () => {
        setUpdateMode('instruction');
    };

    const submitInstruction = () => {
        let instructionToUse = '';
        
        if (instructionMethod === 'text') {
            if (textInputRef.current) {
                instructionToUse = textInputRef.current.value.trim();
            }
        } else {
            instructionToUse = capturedInstruction || userInstruction;
        }
        
        if (instructionToUse.trim()) {
            setShowUpdateModal(false);
            setUpdateMode(null);
            setIsRecordingInstruction(false);
            
            setIsProcessing(true);
            
            setTimeout(() => {
                setIsProcessing(false);
                setChatMessages(prev => [...prev, 
                    { id: Date.now(), text: `I've updated your artwork with your instruction: "${instructionToUse}". The new version incorporates your creative direction while preserving the original sound essence.`, type: 'ai' }
                ]);
                speakText(`Artwork updated with your instruction: ${instructionToUse}`);
                setUserInstruction('');
                setCapturedInstruction('');
                if (textInputRef.current) {
                    textInputRef.current.value = '';
                }
                playAccessibilityTone(523.25, 0.4);
            }, 2500);
        } else {
            speakText("Please provide an instruction before updating.");
        }
    };

    const generateShareLink = () => {
        const newShareLink = `https://echocanvas.art/share/${Math.random().toString(36).substr(2, 9)}`;
        setShareLink(newShareLink);
        setShowShareModal(true);
        
        setChatMessages(prev => [...prev, 
            { id: Date.now(), text: "I've generated a shareable link for your artwork. You can copy it to share with others or save it for later.", type: 'ai' },
            { id: Date.now() + 1, text: newShareLink, type: 'ai' }
        ]);
        
        speakText("Share link generated and ready to copy.");
        playAccessibilityTone(659.25, 0.4);
    };

    const copyShareLink = () => {
        navigator.clipboard.writeText(shareLink).then(() => {
            setChatMessages(prev => [...prev, 
                { id: Date.now(), text: "Link copied to clipboard!", type: 'ai' }
            ]);
            speakText("Share link copied to clipboard.");
            setShowShareModal(false);
        });
    };

    const handleChatSend = () => {
        if (chatInputRef.current && chatInputRef.current.value.trim()) {
            const message = chatInputRef.current.value;
            setChatMessages(prev => [...prev, 
                { id: Date.now(), text: message, type: 'user' }
            ]);
            chatInputRef.current.value = '';
            
            setTimeout(() => {
                const responses = [
                    "That's an interesting thought about your artwork! The way the colors interact really does create a sense of movement and emotion.",
                    "I can see why you'd say that. The patterns in this piece reflect the unique frequencies of your original sound recording.",
                    "Your observation highlights the beautiful complexity of sound-to-art transformation. Each element corresponds to different audio frequencies.",
                    "That's a wonderful insight! The artwork captures both the rhythm and tone of your recording in visual form."
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                setChatMessages(prev => [...prev, 
                    { id: Date.now() + 1, text: response, type: 'ai' }
                ]);
                speakText(response);
            }, 1000);
        }
    };

    // Welcome Screen
    if (currentScreen === 'welcome') {
        return React.createElement('div', {
            className: 'min-h-screen flex items-center justify-center',
            style: { animation: 'fadeIn 0.8s ease-out' }
        }, 
            React.createElement('div', {
                className: 'text-center text-white'
            }, [
                React.createElement('div', {
                    className: 'w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm',
                    style: { animation: 'scaleIn 0.8s ease-out 0.2s both' }
                }, React.createElement('svg', {
                    className: 'w-14 h-14 text-white',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24'
                }, React.createElement('path', {
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    strokeWidth: 1.5,
                    d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                }))),
                
                React.createElement('h1', {
                    className: 'text-5xl font-bold mb-4',
                    style: { animation: 'fadeIn 0.8s ease-out 0.4s both' }
                }, 'Echo Canvas'),
                
                React.createElement('p', {
                    className: 'text-lg text-blue-100 mb-2',
                    style: { animation: 'fadeIn 0.8s ease-out 0.6s both' }
                }, 'Transform sounds into beautiful art'),
                
                React.createElement('div', {
                    className: 'w-48 h-1 bg-blue-400/30 rounded-full mx-auto mt-8 overflow-hidden'
                }, React.createElement('div', {
                    className: 'w-full h-full bg-blue-300 loading-line'
                }))
            ])
        );
    }

    // Creation Screen
    if (currentScreen === 'creation') {
        return React.createElement(React.Fragment, null, [
            showGestureOverlay && React.createElement('div', {
                key: 'gesture-overlay',
                className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-40'
            }, [
                React.createElement('div', {
                    className: 'text-center text-white card p-8'
                }, [
                    React.createElement('svg', {
                        className: 'w-12 h-12 text-white mx-auto mb-4',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z'
                    })),
                    React.createElement('p', {
                        className: 'text-lg font-medium'
                    }, 'Recording in Progress'),
                    React.createElement('p', {
                        className: 'text-blue-200'
                    }, 'Release to stop recording')
                ])
            ]),

            showVoiceIndicator && React.createElement('div', {
                key: 'voice-indicator',
                className: 'voice-indicator'
            }, `🎤 Listening... "${voiceCommand}"`),

            React.createElement('div', {
                key: 'creation-screen',
                className: 'min-h-screen flex flex-col items-center justify-center p-6 relative',
                style: { animation: 'fadeIn 0.5s ease-out' },
                onMouseDown: handleRecordingStart,
                onTouchStart: handleRecordingStart,
                onMouseUp: handleRecordingEnd,
                onTouchEnd: handleRecordingEnd,
                onMouseLeave: handleRecordingEnd,
                onKeyDown: handleKeyDown,
                onKeyUp: handleKeyUp,
                tabIndex: 0,
                role: 'button',
                'aria-label': isRecording ? 
                    `Recording in progress. ${recordingTime} seconds. Release to stop recording.` : 
                    'Press and hold anywhere on screen to record sound. Release when finished.'
            }, [
                React.createElement('div', {
                    className: 'absolute top-6 left-6 card px-4 py-2'
                }, React.createElement('p', {
                    className: 'text-white text-sm font-medium'
                }, selectedStyle)),

                React.createElement('button', {
                    onClick: goBackToSelection,
                    className: 'absolute top-6 right-6 card px-4 py-2 text-white hover:bg-white/10 transition-colors focus-ring hover-lift z-30'
                }, '← Back'),

                isProcessing ? React.createElement('div', {
                    className: 'absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm'
                }, 
                    React.createElement('div', {
                        className: 'text-center text-white card p-8 max-w-md mx-4'
                    }, [
                        React.createElement('svg', {
                            className: 'w-16 h-16 text-green-400 mx-auto mb-4',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 1.5,
                            d: 'M13 10V3L4 14h7v7l9-11h-7z'
                        })),
                        React.createElement('h3', {
                            className: 'text-2xl font-bold mb-2'
                        }, 'Creating Your Artwork'),
                        React.createElement('p', {
                            className: 'text-blue-100 mb-4'
                        }, 'Transforming your sound into visual magic...'),
                        React.createElement('div', {
                            className: 'w-48 h-1 bg-blue-400/30 rounded-full mx-auto overflow-hidden'
                        }, React.createElement('div', {
                            className: 'w-full h-full bg-green-400 loading-line'
                        }))
                    ])
                ) : null,

                React.createElement('div', {
                    className: 'text-center max-w-md z-20'
                }, [
                    React.createElement('h1', {
                        className: 'text-3xl font-bold text-white mb-6'
                    }, 'Create Your Sound Art'),

                    React.createElement('p', {
                        className: 'text-blue-100 mb-8 leading-relaxed'
                    }, 'Tap and hold anywhere to record your sound. The app will transform it into visual art.'),

                    React.createElement('div', {
                        className: 'creation-orb mb-6 ' + (isRecording ? 'recording' : ''),
                        onMouseDown: handleRecordingStart,
                        onTouchStart: handleRecordingStart,
                        onMouseUp: handleRecordingEnd,
                        onTouchEnd: handleRecordingEnd,
                        onMouseLeave: handleOrbMouseLeave,
                        role: 'button',
                        'aria-label': isRecording ? 
                            `Recording in progress. ${recordingTime} seconds. Release to stop or leave orb area to auto-stop.` : 
                            'Press and hold to record sound. Release when finished or leave orb area to auto-stop.',
                        tabIndex: 0
                    }, 
                        isRecording ? 
                            React.createElement('div', {
                                className: 'flex items-center justify-center'
                            }, [0, 1, 2, 3, 4].map(i => 
                                React.createElement('div', {
                                    key: i,
                                    className: 'waveform-bar',
                                    style: { animationDelay: `${i * 0.15}s` }
                                })
                            )) :
                            React.createElement('svg', {
                                className: 'w-14 h-14 text-white',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24'
                            }, React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 1.5,
                                d: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z'
                            }))
                    ),

                    React.createElement('div', {
                        className: 'text-center mb-4'
                    }, 
                        isRecording ? 
                            React.createElement('div', {}, [
                                React.createElement('p', {
                                    className: 'text-green-300 text-lg font-medium mb-1'
                                }, 'Recording Sound...'),
                                React.createElement('p', {
                                    className: 'text-blue-200 text-sm'
                                }, `${recordingTime}s - Release when ready or leave orb area`)
                            ]) :
                            React.createElement('p', {
                                className: 'text-blue-200 text-lg'
                            }, 'Press and hold anywhere to start')
                    ),

                    React.createElement('div', {
                        className: 'card p-4 mt-6'
                    }, [
                        React.createElement('p', {
                            className: 'text-blue-200 text-sm mb-2'
                        }, '💡 Voice Command: Say "start recording" to begin, "stop recording" to finish'),
                        React.createElement('p', {
                            className: 'text-blue-200 text-xs'
                        }, 'Say "stop when I leave the orb" for auto-stop feature')
                    ]),

                    React.createElement('div', {
                        className: 'card p-4 mt-4 bg-yellow-500/20 border-yellow-400/40'
                    }, [
                        React.createElement('p', {
                            className: 'text-yellow-200 text-sm font-medium mb-1'
                        }, '👆 Gesture Control Active'),
                        React.createElement('p', {
                            className: 'text-yellow-200 text-xs'
                        }, 'Touch/hold anywhere on screen - no need to find the button!')
                    ]),

                    React.createElement('div', {
                        className: 'card p-4 mt-4 bg-green-500/20 border-green-400/40'
                    }, [
                        React.createElement('p', {
                            className: 'text-green-300 text-sm font-medium mb-1'
                        }, '🎯 Auto-Stop Feature Active'),
                        React.createElement('p', {
                            className: 'text-green-200 text-xs'
                        }, 'Recording stops automatically when you leave the orb area')
                    ]),

                    isRecording ? null : React.createElement('div', {
                        className: 'w-48 h-1 bg-blue-400/30 rounded-full mx-auto mt-4 overflow-hidden'
                    }, React.createElement('div', {
                        className: 'w-full h-full bg-blue-300 loading-line'
                    }))
                ])
            ])
        ]);
    }

    // Reveal & Reflect Screen
    if (currentScreen === 'reveal') {
        return React.createElement(React.Fragment, null, [
            showTapGestureIndicator && React.createElement('div', {
                key: 'tap-indicator',
                className: 'tap-gesture-indicator'
            }, React.createElement('div', {
                className: 'tap-bubble'
            }, `Tap ${tapCount > 0 ? tapCount + ' ' : ''}detected! ${audioMenuActive ? 'Listening for commands...' : 'Gesture control active'}`)),

            showVoiceIndicator && React.createElement('div', {
                key: 'voice-indicator',
                className: 'voice-indicator'
            }, `🎤 Listening... "${voiceCommand}"`),

            React.createElement('div', {
                key: 'reveal-screen',
                className: 'min-h-screen flex flex-col',
                style: { animation: 'fadeIn 0.5s ease-out' },
                onClick: handleRevealScreenTap
            }, [
                React.createElement('div', {
                    className: 'flex justify-between items-center p-6'
                }, [
                    React.createElement('div', {
                        className: 'card px-4 py-2'
                    }, React.createElement('p', {
                        className: 'text-white text-sm font-medium'
                    }, selectedStyle)),
                    
                    React.createElement('button', {
                        ref: createNewButtonRef,
                        onClick: showCreateNewOptions,
                        onMouseEnter: () => handleCreateNewHover(true),
                        onMouseLeave: () => handleCreateNewHover(false),
                        className: 'create-new-btn card px-4 py-2 text-white hover:bg-white/10 transition-colors focus-ring hover-lift',
                        'aria-label': 'Create New Artwork. Hover for 2 seconds to automatically open create options.'
                    }, 'Create New')
                ]),

                React.createElement('div', {
                    ref: artDisplayRef,
                    className: `art-display mx-6 mt-4 mb-6 ${audioMenuActive ? 'border-2 border-purple-400' : ''}`
                }, [
                    React.createElement('div', {
                        className: 'text-center text-white'
                    }, [
                        React.createElement('h2', {
                            className: 'text-2xl font-bold mb-4'
                        }, 'Your Sound Artwork'),
                        React.createElement('p', {
                            className: 'text-blue-100'
                        }, `Created from ${recordingTime} seconds of sound`),
                        React.createElement('div', {
                            className: 'mt-4 text-sm text-blue-200'
                        }, `${selectedStyle} • ${new Date().toLocaleDateString()}`),
                        audioMenuActive && React.createElement('div', {
                            className: 'mt-6 p-4 bg-purple-500/20 rounded-lg border border-purple-400/40'
                        }, [
                            React.createElement('p', {
                                className: 'text-purple-200 font-semibold mb-2'
                            }, '🎧 Audio Menu Active'),
                            React.createElement('p', {
                                className: 'text-purple-100 text-sm'
                            }, 'Say "One", "Two", or "Three" • Tap 1-3 times • Hover over Create New for 2 seconds')
                        ])
                    ])
                ]),

                React.createElement('div', {
                    className: 'action-bar'
                }, [
                    React.createElement('button', {
                        onClick: () => handleActionSelection(1),
                        className: 'action-btn card hover-lift focus-ring',
                        'aria-label': 'Update Art - Modify or regenerate your artwork. Say "One" or tap once.'
                    }, React.createElement('svg', {
                        className: 'w-6 h-6 text-white',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    }))),
                    
                    React.createElement('button', {
                        onClick: () => handleActionSelection(3),
                        className: 'action-btn card hover-lift focus-ring',
                        'aria-label': 'Describe My Art - Get a detailed description of your artwork. Say "Three" or tap three times.'
                    }, React.createElement('svg', {
                        className: 'w-6 h-6 text-white',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    }))),
                    
                    React.createElement('button', {
                        onClick: () => handleActionSelection(2),
                        className: 'action-btn card hover-lift focus-ring',
                        'aria-label': 'Generate Share Link - Create a shareable link for your artwork. Say "Two" or tap twice.'
                    }, React.createElement('svg', {
                        className: 'w-6 h-6 text-white',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                    })))
                ]),

                React.createElement('div', {
                    className: 'card mx-6 mb-4 p-4'
                }, [
                    React.createElement('h4', {
                        className: 'text-white font-semibold mb-2 text-center'
                    }, '🎯 Multiple Control Methods:'),
                    React.createElement('div', {
                        className: 'grid grid-cols-1 gap-2 text-xs text-blue-200'
                    }, [
                        React.createElement('div', {
                            className: 'flex justify-between'
                        }, [
                            React.createElement('span', null, '👆 Tap Once'),
                            React.createElement('span', null, 'Update Art')
                        ]),
                        React.createElement('div', {
                            className: 'flex justify-between'
                        }, [
                            React.createElement('span', null, '👆👆 Tap Twice'),
                            React.createElement('span', null, 'Share Link')
                        ]),
                        React.createElement('div', {
                            className: 'flex justify-between'
                        }, [
                            React.createElement('span', null, '👆👆👆 Tap Three Times'),
                            React.createElement('span', null, 'Describe Again')
                        ]),
                        React.createElement('div', {
                            className: 'flex justify-between'
                        }, [
                            React.createElement('span', null, '🖱️ Hover Create New (2s)'),
                            React.createElement('span', null, 'Auto-open Create Options')
                        ])
                    ])
                ]),

                React.createElement('div', {
                    className: 'card mx-6 mt-4 mb-6 flex-1 flex flex-col hover-lift'
                }, [
                    React.createElement('div', {
                        className: 'p-4 border-b border-white/10'
                    }, React.createElement('h3', {
                        className: 'text-white font-semibold'
                    }, 'Art Companion')),
                    
                    React.createElement('div', {
                        className: 'chat-window flex-1 p-4 flex flex-col'
                    }, chatMessages.map(message => 
                        React.createElement('div', {
                            key: message.id,
                            className: `chat-message ${message.type === 'ai' ? 'chat-ai' : 'chat-user'}`
                        }, React.createElement('p', {
                            className: 'text-white text-sm'
                        }, message.text))
                    )),
                    
                    React.createElement('div', {
                        className: 'p-4 border-t border-white/10 flex gap-2'
                    }, [
                        React.createElement('input', {
                            ref: chatInputRef,
                            type: 'text',
                            placeholder: 'Ask about your artwork...',
                            className: 'flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300',
                            onKeyPress: (e) => {
                                if (e.key === 'Enter') handleChatSend();
                            }
                        }),
                        React.createElement('button', {
                            onClick: handleChatSend,
                            className: 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors focus-ring'
                        }, 'Send')
                    ])
                ])
            ]),

            showUpdateModal && React.createElement('div', {
                key: 'update-modal',
                className: 'fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50',
                style: { animation: 'overlayIn 0.3s ease-out' },
                onClick: () => {
                    setShowUpdateModal(false);
                    setUpdateMode(null);
                    setUserInstruction('');
                    setIsRecordingInstruction(false);
                    setCapturedInstruction('');
                }
            }, 
                React.createElement('div', {
                    className: 'card p-8 max-w-md w-full voice-instruction-container',
                    style: { animation: 'modalIn 0.3s ease-out' },
                    onClick: (e) => e.stopPropagation()
                }, [
                    isRecordingInstruction && 
                    React.createElement('div', {
                        className: 'listening-indicator text-center mb-6'
                    }, `🎤 Recording Instruction... ${instructionRecordingTime}s`),

                    React.createElement('h2', {
                        className: 'text-2xl font-bold text-gray-800 mb-4 text-center'
                    }, 'Update Your Art'),
                    
                    updateMode === 'instruction' ? 
                        React.createElement('div', {
                            className: 'space-y-6'
                        }, [
                            React.createElement('div', {
                                className: 'tab-container'
                            }, [
                                React.createElement('div', {
                                    className: `tab ${instructionMethod === 'text' ? 'active' : ''}`,
                                    onClick: () => setInstructionMethod('text')
                                }, '📝 Text Input'),
                                React.createElement('div', {
                                    className: `tab ${instructionMethod === 'mic' ? 'active' : ''}`,
                                    onClick: () => setInstructionMethod('mic')
                                }, '🎤 Voice Input')
                            ]),

                            instructionMethod === 'text' ? 
                                React.createElement('div', {
                                    className: 'space-y-4'
                                }, [
                                    React.createElement('p', {
                                        className: 'text-gray-600 text-center mb-4'
                                    }, 'Type your instruction for the artwork:'),
                                    
                                    React.createElement('div', {
                                        className: 'text-input-container'
                                    }, React.createElement('textarea', {
                                        ref: textInputRef,
                                        className: 'text-input',
                                        placeholder: 'Describe how you want to update your artwork... For example: "Make it more vibrant with blues and greens" or "Add more abstract patterns"',
                                        rows: 4
                                    })),
                                    
                                    React.createElement('div', {
                                        className: 'flex gap-3 mt-4'
                                    }, [
                                        React.createElement('button', {
                                            onClick: submitInstruction,
                                            className: 'btn-primary flex-1 py-3 rounded-lg font-medium focus-ring hover-lift'
                                        }, 'Update Art'),
                                        React.createElement('button', {
                                            onClick: () => {
                                                setUpdateMode(null);
                                                if (textInputRef.current) {
                                                    textInputRef.current.value = '';
                                                }
                                            },
                                            className: 'card text-gray-600 flex-1 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors focus-ring hover-lift'
                                        }, 'Back')
                                    ])
                                ]) :
                                React.createElement('div', {
                                    className: 'space-y-6'
                                }, [
                                    React.createElement('p', {
                                        className: 'text-gray-600 text-center mb-4'
                                    }, isRecordingInstruction ? 
                                        `Recording... ${instructionRecordingTime}s - Say "stop" when finished` :
                                        'Describe how you want to update your artwork using your voice'),
                                    
                                    React.createElement('div', {
                                        className: `instruction-display ${isRecordingInstruction ? 'recording' : ''}`
                                    }, 
                                        capturedInstruction ? 
                                            React.createElement('p', {
                                                className: 'instruction-text'
                                            }, capturedInstruction) :
                                            React.createElement('p', {
                                                className: 'instruction-text instruction-placeholder'
                                            }, isRecordingInstruction ? 
                                                'Listening for your instruction...' :
                                                'Your instruction will appear here when you start speaking')
                                    ),
                                    
                                    React.createElement('div', {
                                        className: 'text-center'
                                    }, 
                                        isRecordingInstruction ?
                                            React.createElement('button', {
                                                onClick: stopInstructionRecording,
                                                className: 'mic-button-large recording focus-ring'
                                            }, React.createElement('svg', {
                                                className: 'w-8 h-8 text-white',
                                                fill: 'none',
                                                stroke: 'currentColor',
                                                viewBox: '0 0 24 24'
                                            }, React.createElement('path', {
                                                strokeLinecap: 'round',
                                                strokeLinejoin: 'round',
                                                strokeWidth: 2,
                                                d: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                            }))) :
                                            React.createElement('button', {
                                                onClick: startInstructionRecording,
                                                className: 'mic-button-large focus-ring hover-lift'
                                            }, React.createElement('svg', {
                                                className: 'w-8 h-8 text-white',
                                                fill: 'none',
                                                stroke: 'currentColor',
                                                viewBox: '0 0 24 24'
                                            }, React.createElement('path', {
                                                strokeLinecap: 'round',
                                                strokeLinejoin: 'round',
                                                strokeWidth: 2,
                                                d: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z'
                                            })))
                                    ),
                                    
                                    React.createElement('div', {
                                        className: 'flex gap-3 mt-4'
                                    }, [
                                        React.createElement('button', {
                                            onClick: submitInstruction,
                                            disabled: !capturedInstruction.trim(),
                                            className: `flex-1 py-3 rounded-lg font-medium focus-ring hover-lift ${
                                                capturedInstruction.trim() ? 
                                                'btn-primary' : 
                                                'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`
                                        }, 'Update Art'),
                                        React.createElement('button', {
                                            onClick: () => {
                                                setUpdateMode(null);
                                                setCapturedInstruction('');
                                                setIsRecordingInstruction(false);
                                            },
                                            className: 'card text-gray-600 flex-1 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors focus-ring hover-lift'
                                        }, 'Back')
                                    ]),
                                    
                                    React.createElement('div', {
                                        className: 'p-3 bg-blue-50 border border-blue-200 rounded-lg'
                                    }, [
                                        React.createElement('p', {
                                            className: 'text-blue-700 text-sm text-center'
                                        }, isRecordingInstruction ? 
                                            '💡 Say "stop" to finish recording, or "cancel" to start over' :
                                            '💡 Click the microphone and speak your instruction. Say "stop" when finished.')
                                    ])
                                ])
                        ]) :
                        React.createElement('div', {}, [
                            React.createElement('p', {
                                className: 'text-gray-600 mb-6 text-center'
                            }, 'How would you like to update this piece?'),

                            React.createElement('div', {
                                className: 'space-y-4'
                            }, [
                                React.createElement('button', {
                                    ref: tryAgainButtonRef,
                                    onClick: tryAgain,
                                    onMouseDown: () => handleButtonVoiceCommand('tryAgain'),
                                    className: `voice-command-btn card p-6 text-left w-full hover-lift focus-ring group ${
                                        voiceCommandActive === 'tryAgain' ? 'voice-command-active' : ''
                                    }`
                                }, [
                                    React.createElement('h3', {
                                        className: 'text-gray-800 font-semibold text-lg mb-2'
                                    }, 'Try Again'),
                                    React.createElement('p', {
                                        className: 'text-gray-600'
                                    }, 'Generate a new version using the same sound.'),
                                    React.createElement('p', {
                                        className: 'text-blue-500 text-xs mt-2'
                                    }, '🎤 Hold click + say "yes" for voice command')
                                ]),
                                
                                React.createElement('button', {
                                    ref: addInstructionButtonRef,
                                    onClick: addInstruction,
                                    onMouseDown: () => handleButtonVoiceCommand('addInstruction'),
                                    className: `voice-command-btn card p-6 text-left w-full hover-lift focus-ring group border-2 border-purple-400 ${
                                        voiceCommandActive === 'addInstruction' ? 'voice-command-active' : ''
                                    }`
                                }, [
                                    React.createElement('h3', {
                                        className: 'text-purple-800 font-semibold text-lg mb-2'
                                    }, 'Add Instruction'),
                                    React.createElement('p', {
                                        className: 'text-purple-600'
                                    }, 'Guide the next version with your text or voice command.'),
                                    React.createElement('p', {
                                        className: 'text-purple-500 text-xs mt-2'
                                    }, '🎤 Hold click + say "yes" for voice command')
                                ])
                            ])
                        ])
                ])
            ),

            showCreateNewModal && React.createElement('div', {
                key: 'create-new-modal',
                className: 'fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50',
                style: { animation: 'overlayIn 0.3s ease-out' },
                onClick: () => setShowCreateNewModal(false)
            }, 
                React.createElement('div', {
                    className: 'card p-8 max-w-md w-full',
                    style: { animation: 'modalIn 0.3s ease-out' },
                    onClick: (e) => e.stopPropagation()
                }, [
                    React.createElement('h2', {
                        className: 'text-2xl font-bold text-gray-800 mb-4'
                    }, 'Create New Artwork'),
                    
                    React.createElement('p', {
                        className: 'text-gray-600 mb-6'
                    }, 'Choose how you want to create your next masterpiece:'),

                    React.createElement('div', {
                        className: 'space-y-4'
                    }, [
                        React.createElement('button', {
                            onClick: tryNewArtwork,
                            className: 'voice-command-btn card p-6 text-left w-full hover-lift focus-ring group bg-blue-50 border-blue-200'
                        }, [
                            React.createElement('h3', {
                                className: 'text-blue-800 font-semibold text-lg mb-2'
                            }, 'Try New Artwork'),
                            React.createElement('p', {
                                className: 'text-blue-600'
                            }, 'Create a completely new artwork with different patterns and colors')
                        ]),
                        
                        React.createElement('button', {
                            onClick: addNewInstruction,
                            className: 'voice-command-btn card p-6 text-left w-full hover-lift focus-ring group bg-purple-50 border-purple-200'
                        }, [
                            React.createElement('h3', {
                                className: 'text-purple-800 font-semibold text-lg mb-2'
                            }, 'Add Instruction'),
                            React.createElement('p', {
                                className: 'text-purple-600'
                            }, 'Guide the creation with your specific instructions and preferences')
                        ]),
                        
                        React.createElement('button', {
                            ref: startNewButtonRef,
                            onClick: restartFlow,
                            onMouseDown: () => handleButtonVoiceCommand('startNew'),
                            className: `voice-command-btn card p-6 text-left w-full hover-lift focus-ring group bg-green-50 border-green-200 ${
                                voiceCommandActive === 'startNew' ? 'voice-command-active' : ''
                            }`
                        }, [
                            React.createElement('h3', {
                                className: 'text-green-800 font-semibold text-lg mb-2'
                            }, 'Start Fresh'),
                            React.createElement('p', {
                                className: 'text-green-600'
                            }, 'Go back to the beginning and choose a new style'),
                            React.createElement('p', {
                                className: 'text-green-500 text-xs mt-2'
                            }, '🎤 Hold click + say "yes" for voice command')
                        ])
                    ]),

                    React.createElement('div', {
                        className: 'mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'
                    }, [
                        React.createElement('h4', {
                            className: 'text-yellow-800 font-semibold mb-2 text-center'
                        }, '🎤 Voice Commands Available'),
                        React.createElement('div', {
                            className: 'grid grid-cols-1 gap-1 text-sm text-yellow-700'
                        }, [
                            React.createElement('div', {
                                className: 'flex justify-between'
                            }, [
                                React.createElement('span', null, 'Say "Try New Artwork" or "One"'),
                                React.createElement('span', null, '→ Try New Artwork')
                            ]),
                            React.createElement('div', {
                                className: 'flex justify-between'
                            }, [
                                React.createElement('span', null, 'Say "Add Instruction" or "Two"'),
                                React.createElement('span', null, '→ Add Instruction')
                            ]),
                            React.createElement('div', {
                                className: 'flex justify-between'
                            }, [
                                React.createElement('span', null, 'Say "Start Fresh" or "Three"'),
                                React.createElement('span', null, '→ Start Fresh')
                            ]),
                            React.createElement('div', {
                                className: 'flex justify-between'
                            }, [
                                React.createElement('span', null, 'Hold click + say "yes"'),
                                React.createElement('span', null, '→ Voice command buttons')
                            ])
                        ])
                    ])
                ])
            ),

            showShareModal && React.createElement('div', {
                key: 'share-modal',
                className: 'fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50',
                style: { animation: 'overlayIn 0.3s ease-out' },
                onClick: () => setShowShareModal(false)
            }, 
                React.createElement('div', {
                    className: 'card p-8 max-w-md w-full',
                    style: { animation: 'modalIn 0.3s ease-out' },
                    onClick: (e) => e.stopPropagation()
                }, [
                    React.createElement('h2', {
                        className: 'text-2xl font-bold text-white mb-4'
                    }, 'Share Your Artwork'),
                    
                    React.createElement('p', {
                        className: 'text-blue-100 mb-4'
                    }, 'Your artwork is now available at:'),
                    
                    React.createElement('div', {
                        className: 'bg-white/10 border border-white/20 rounded-lg p-4 mb-6'
                    }, React.createElement('p', {
                        className: 'text-white font-mono text-sm break-all'
                    }, shareLink)),
                    
                    React.createElement('button', {
                        onClick: copyShareLink,
                        className: 'btn-primary w-full py-3 rounded-lg font-medium focus-ring hover-lift'
                    }, 'Copy Link to Clipboard')
                ])
            ),

            isProcessing && React.createElement('div', {
                key: 'processing-overlay',
                className: 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm'
            }, 
                React.createElement('div', {
                    className: 'text-center text-white card p-8 max-w-md mx-4'
                }, [
                    React.createElement('svg', {
                        className: 'w-16 h-16 text-green-400 mx-auto mb-4',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 1.5,
                        d: 'M13 10V3L4 14h7v7l9-11h-7z'
                    })),
                    React.createElement('h3', {
                        className: 'text-2xl font-bold mb-2'
                    }, 'Updating Your Artwork'),
                    React.createElement('p', {
                        className: 'text-blue-100 mb-4'
                    }, 'Applying your changes and creating new variations...'),
                    React.createElement('div', {
                        className: 'w-48 h-1 bg-blue-400/30 rounded-full mx-auto overflow-hidden'
                    }, React.createElement('div', {
                        className: 'w-full h-full bg-green-400 loading-line'
                    }))
                ])
            )
        ]);
    }

    // Style Selection Screen (Main Screen)
    return React.createElement('div', {
        className: 'min-h-screen flex items-center justify-center p-6',
        style: { 
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out'
        }
    }, 
        React.createElement('div', {
            className: 'max-w-4xl w-full mx-auto'
        }, [
            showVoiceIndicator && React.createElement('div', {
                className: 'voice-indicator mb-6'
            }, `🎤 Listening... "${voiceCommand}"`),

            React.createElement('div', {
                className: 'text-center mb-12',
                style: {
                    animation: isLoaded ? 'fadeIn 0.8s ease-out 0.2s both' : 'none'
                }
            }, [
                React.createElement('h1', {
                    ref: mainHeadingRef,
                    className: 'text-4xl md:text-5xl font-bold text-white mb-6'
                }, 'Welcome to Echo Canvas'),
                
                React.createElement('p', {
                    className: 'text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed'
                }, 'Transform your sounds into beautiful, accessible art through AI'),
                
                React.createElement('div', {
                    className: 'card inline-block px-6 py-3 hover-lift mb-4'
                }, React.createElement('p', {
                    className: 'text-lg text-white font-medium'
                }, 'To begin, please choose your preferred visual style:')),

                React.createElement('div', {
                    className: 'card p-4 max-w-md mx-auto'
                }, [
                    React.createElement('p', {
                        className: 'text-blue-200 text-sm mb-2 text-center'
                    }, '💡 Hover over any style for 2 seconds to automatically select it'),
                    React.createElement('p', {
                        className: 'text-blue-200 text-xs text-center'
                    }, 'Voice commands are automatically active - say "default" or "accessible"')
                ])
            ]),
            
            React.createElement('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto'
            }, [
                React.createElement('button', {
                    onClick: () => handleStyleSelect('Default Style'),
                    onMouseEnter: () => handleStyleHover('Default Style', true),
                    onMouseLeave: () => handleStyleHover('Default Style', false),
                    onFocus: () => handleStyleHover('Default Style', true),
                    onBlur: () => handleStyleHover('Default Style', false),
                    className: 'card p-8 text-left cursor-pointer style-card focus-ring group ' + 
                        (hoveredStyle === 'Default Style' ? 'ring-4 ring-purple-400/50 ' : '') +
                        (autoSelectingStyle === 'Default Style' ? 'auto-selecting ' : ''),
                    style: { 
                        animation: isLoaded ? 'slideInFromLeft 0.8s ease-out 0.4s both' : 'none'
                    },
                    'aria-label': 'Default Style. For a full spectrum of colors and artistic nuance. Hover for 2 seconds to auto-select.'
                }, [
                    React.createElement('div', {
                        className: 'flex items-center gap-4 mb-6'
                    }, [
                        React.createElement('div', {
                            className: 'w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform'
                        }, React.createElement('svg', {
                            className: 'w-7 h-7 text-white',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
                        }))),
                        React.createElement('h2', {
                            className: 'text-2xl font-semibold text-white'
                        }, 'Default Style')
                    ]),
                    
                    React.createElement('div', {
                        className: 'w-full h-36 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-105'
                    }, 
                        autoSelectingStyle === 'Default Style' ?
                        React.createElement('div', {
                            className: 'text-white text-center'
                        }, [
                            React.createElement('p', {
                                className: 'text-lg font-medium mb-2'
                            }, '🎨'),
                            React.createElement('p', {
                                className: 'text-sm'
                            }, 'Selecting...')
                        ]) :
                        React.createElement('div', {
                            className: 'w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center'
                        }, React.createElement('svg', {
                            className: 'w-8 h-8 text-white/90',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                        })))
                    ),
                    
                    React.createElement('p', {
                        className: 'text-blue-100 leading-relaxed mb-4 text-center'
                    }, 'For a full spectrum of colors and artistic nuance.'),
                    
                    React.createElement('div', {
                        className: 'flex justify-center pt-4 border-t border-white/20'
                    }, [
                        React.createElement('span', {
                            className: 'text-purple-300 text-sm font-medium'
                        }, autoSelectingStyle === 'Default Style' ? '🔄 Auto-selecting...' : 'Full Color Spectrum')
                    ])
                ]),
                
                React.createElement('button', {
                    onClick: () => handleStyleSelect('Accessible Style'),
                    onMouseEnter: () => handleStyleHover('Accessible Style', true),
                    onMouseLeave: () => handleStyleHover('Accessible Style', false),
                    onFocus: () => handleStyleHover('Accessible Style', true),
                    onBlur: () => handleStyleHover('Accessible Style', false),
                    className: 'card p-8 text-left cursor-pointer style-card focus-ring group border-2 border-yellow-400/40 ' + 
                        (hoveredStyle === 'Accessible Style' ? 'ring-4 ring-yellow-400/50 ' : '') +
                        (autoSelectingStyle === 'Accessible Style' ? 'auto-selecting ' : ''),
                    style: { 
                        animation: isLoaded ? 'slideInFromRight 0.8s ease-out 0.6s both' : 'none'
                    },
                    'aria-label': 'Accessible Style. Designed with high contrast for visual clarity. Hover for 2 seconds to auto-select.'
                }, [
                    React.createElement('div', {
                        className: 'flex items-center gap-4 mb-6'
                    }, [
                        React.createElement('div', {
                            className: 'w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center border-2 border-yellow-400 group-hover:scale-105 transition-transform'
                        }, React.createElement('svg', {
                            className: 'w-7 h-7 text-yellow-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        }))),
                        React.createElement('h2', {
                            className: 'text-2xl font-semibold text-white'
                        }, 'Accessible Style')
                    ]),
                    
                    React.createElement('div', {
                        className: 'w-full h-36 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl mb-4 flex items-center justify-center border-2 border-yellow-400 transition-transform duration-300 group-hover:scale-105'
                    }, 
                        autoSelectingStyle === 'Accessible Style' ?
                        React.createElement('div', {
                            className: 'text-white text-center'
                        }, [
                            React.createElement('p', {
                                className: 'text-lg font-medium mb-2 text-yellow-300'
                            }, '♿'),
                            React.createElement('p', {
                                className: 'text-sm text-yellow-300'
                            }, 'Selecting...')
                        ]) :
                        React.createElement('div', {
                            className: 'w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg'
                        }, React.createElement('svg', {
                            className: 'w-8 h-8 text-gray-800',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        }, React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                        })))
                    ),
                    
                    React.createElement('p', {
                        className: 'text-blue-100 leading-relaxed mb-4 text-center'
                    }, 'Designed with high contrast for visual clarity.'),
                    
                    React.createElement('div', {
                        className: 'flex justify-center pt-4 border-t border-yellow-400/30'
                    }, [
                        React.createElement('span', {
                            className: 'text-yellow-300 text-sm font-medium'
                        }, autoSelectingStyle === 'Accessible Style' ? '🔄 Auto-selecting...' : 'High Contrast Design')
                    ])
                ])
            ]),
            
            React.createElement('div', {
                className: 'text-center mt-12',
                style: {
                    animation: isLoaded ? 'fadeIn 0.8s ease-out 0.8s both' : 'none'
                }
            }, React.createElement('div', {
                className: 'card inline-block px-6 py-4 hover-lift'
            }, React.createElement('p', {
                className: 'text-blue-200 text-sm'
            }, '♿ Fully Accessible • 🎨 Professional Design • 🔊 SCREEN-SPECIFIC Voice Commands • 🗣️ Hands-Free Selection • 🎤 Text-to-Speech • 👆 Gesture Control • 🔊 Audio Menus • 🖱️ Auto Hover Features • 🎯 Auto-Stop Recording • 🔊 Voice Activation on Recording • 🎤 WORKING Microphone AND Text Instruction Options • 🌟 Enhanced Dynamic Background • ✅ FIXED VOICE COMMAND CONFLICTS • 🎤 VOICE COMMAND BUTTONS')))
        ])
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
