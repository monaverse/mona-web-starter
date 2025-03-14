document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const requestOtpSection = document.getElementById('request-otp-section');
    const verifyOtpSection = document.getElementById('verify-otp-section');
    const userInfoSection = document.getElementById('user-info');
    const authCard = document.querySelector('.auth-card');
    
    const requestOtpForm = document.getElementById('request-otp-form');
    const verifyOtpForm = document.getElementById('verify-otp-form');
    
    const requestErrorMessage = document.getElementById('request-error-message');
    const requestSuccessMessage = document.getElementById('request-success-message');
    const verifyErrorMessage = document.getElementById('verify-error-message');
    const verifySuccessMessage = document.getElementById('verify-success-message');
    
    const userEmailSpan = document.getElementById('user-email');
    const userUsernameSpan = document.getElementById('user-username');
    const userNameSpan = document.getElementById('user-name');
    const walletsContainer = document.getElementById('wallets-container');
    const assetsContainer = document.getElementById('assets-container') || createAssetsContainer();
    const sceneContainer = document.getElementById('scene-container');
    const threeContainer = document.getElementById('three-container');
    const closeSceneBtn = document.getElementById('close-scene-btn');
    
    const backToEmailBtn = document.getElementById('back-to-email-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // New UI elements
    const communityAssetsBtn = document.querySelector('.community-assets-btn');
    const myAssetsBtn = document.querySelector('.my-assets-btn');
    
    // Add login-state class to auth-card initially
    authCard.classList.add('login-state');
    
    // Add event listeners for new buttons
    if (communityAssetsBtn) {
        communityAssetsBtn.addEventListener('click', function() {
            communityAssetsBtn.classList.add('active');
            myAssetsBtn.classList.remove('active');
            
            // Get access token from localStorage
            const accessToken = localStorage.getItem('monaAccessToken');
            if (accessToken) {
                fetchCommunityTokens(accessToken);
            }
        });
    }
    
    if (myAssetsBtn) {
        myAssetsBtn.addEventListener('click', function() {
            myAssetsBtn.classList.add('active');
            communityAssetsBtn.classList.remove('active');
            
            // Get access token and wallets from localStorage
            const accessToken = localStorage.getItem('monaAccessToken');
            const walletsData = walletsContainer.dataset.wallets;
            
            if (accessToken && walletsData) {
                const wallets = JSON.parse(walletsData);
                fetchAllWalletAssets(accessToken, wallets);
            }
        });
    }
    
    // API Configuration - Updated based on documentation
    const API_BASE_URL = 'https://api.monaverse.com/public';
    const GENERATE_OTP_ENDPOINT = `${API_BASE_URL}/auth/otp/generate`;
    const VERIFY_OTP_ENDPOINT = `${API_BASE_URL}/auth/otp/verify`;
    const USER_PROFILE_ENDPOINT = `${API_BASE_URL}/user`;
    const USER_TOKENS_ENDPOINT = `${API_BASE_URL}/user`; // Base endpoint, will append chain_id and address
    const TOKEN_ANIMATION_ENDPOINT = `${API_BASE_URL}/token`; // Base endpoint, will append chain_id, contract, and tokenId
    const COMMUNITY_TOKENS_ENDPOINT = `${API_BASE_URL}/tokens`; // Base endpoint for community tokens
    
    // Your MONA Application ID - Keep this private
    const MONA_APP_ID = 'YOUR_MONA_APPLICATION_ID';
    
    // Initialize 3D Scene variables
    let scene, camera, renderer, controls, groundPlane, currentModel;
    let isSceneInitialized = false;
    
    // Initialize 3D Scene
    function initScene() {
        if (isSceneInitialized) return;
        
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
        camera.position.set(0, 5, 10);
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
        renderer.shadowMap.enabled = true;
        threeContainer.appendChild(renderer.domElement);
        
        // Create controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2;
        
        // Create lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);
        
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.8,
            metalness: 0.2
        });
        groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
        groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        groundPlane.position.y = 0;
        groundPlane.receiveShadow = true;
        scene.add(groundPlane);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x888888);
        scene.add(gridHelper);
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // Start animation loop
        animate();
        
        isSceneInitialized = true;
        console.log('3D Scene initialized');
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    function onWindowResize() {
        if (!isSceneInitialized) return;
        
        camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    }
    
    // Load 3D model into scene
    function loadModelIntoScene(modelUrl) {
        if (!isSceneInitialized) {
            initScene();
        }
        
        // Show loading message
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.textContent = 'Loading 3D model...';
        threeContainer.appendChild(loadingElement);
        
        // Remove previous model if exists
        if (currentModel) {
            scene.remove(currentModel);
            currentModel = null;
        }
        
        // Create GLTFLoader
        const loader = new THREE.GLTFLoader();
        
        // Load the model
        loader.load(
            modelUrl,
            (gltf) => {
                // Model loaded successfully
                currentModel = gltf.scene;
                
                // Center and scale the model
                const box = new THREE.Box3().setFromObject(currentModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                
                // Scale model to reasonable size
                const maxDimension = Math.max(size.x, size.y, size.z);
                const scale = 5 / maxDimension;
                currentModel.scale.set(scale, scale, scale);
                
                // Position model on ground plane
                currentModel.position.x = -center.x * scale;
                currentModel.position.y = -box.min.y * scale; // Place on ground
                currentModel.position.z = -center.z * scale;
                
                // Enable shadows
                currentModel.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                
                // Add model to scene
                scene.add(currentModel);
                
                // Remove loading message
                threeContainer.removeChild(loadingElement);
                
                console.log('3D model loaded:', modelUrl);
            },
            (xhr) => {
                // Loading progress
                const progress = Math.floor((xhr.loaded / xhr.total) * 100);
                loadingElement.textContent = `Loading 3D model... ${progress}%`;
                console.log(`Loading model: ${progress}%`);
            },
            (error) => {
                // Error loading model
                console.error('Error loading 3D model:', error);
                loadingElement.textContent = 'Error loading 3D model';
                setTimeout(() => {
                    threeContainer.removeChild(loadingElement);
                }, 3000);
            }
        );
        
        // Show scene container
        sceneContainer.classList.remove('hidden');
    }
    
    // Close 3D scene
    function closeScene() {
        sceneContainer.classList.add('hidden');
    }
    
    // Add event listener for close button
    if (closeSceneBtn) {
        closeSceneBtn.addEventListener('click', closeScene);
    }
    
    // Create assets container if it doesn't exist
    function createAssetsContainer() {
        const container = document.createElement('div');
        container.id = 'assets-container';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Your Assets';
        
        const assetsDiv = document.createElement('div');
        assetsDiv.className = 'assets-grid';
        
        container.appendChild(heading);
        container.appendChild(assetsDiv);
        
        // Find the right place to insert it in the DOM
        const userInfoSection = document.getElementById('user-info');
        
        if (userInfoSection) {
            userInfoSection.querySelector('.assets-content').appendChild(container);
        }
        
        return container;
    }
    
    // Check if user is already logged in
    const accessToken = localStorage.getItem('monaAccessToken');
    if (accessToken) {
        console.log('Found existing access token, attempting to fetch user profile');
        // Remove login-state class when user is logged in
        authCard.classList.remove('login-state');
        authCard.classList.add('logged-in-state');
        fetchUserProfile(accessToken);
    } else {
        // Ensure we're in login state if no token is found
        authCard.classList.add('login-state');
        authCard.classList.remove('logged-in-state');
        
        // Make sure user info section is hidden
        userInfoSection.classList.add('hidden');
        requestOtpSection.classList.remove('hidden');
    }
    
    // Step 1: Request OTP
    requestOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        requestErrorMessage.textContent = '';
        requestSuccessMessage.textContent = '';
        
        const email = document.getElementById('email').value;
        console.log('Requesting OTP for email:', email);
        
        try {
            // Show loading message
            requestSuccessMessage.textContent = 'Sending OTP...';
            
            // Make API request to generate OTP
            console.log('Making request to:', GENERATE_OTP_ENDPOINT);
            const response = await fetch(GENERATE_OTP_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Mona-Application-Id': MONA_APP_ID
                },
                body: JSON.stringify({ email })
            });
            
            console.log('OTP request response status:', response.status);
            const data = await response.json();
            console.log('OTP request response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `Failed to send OTP (Status: ${response.status})`);
            }
            
            // Store email for verification step
            localStorage.setItem('monaEmail', email);
            
            // Show success message
            requestSuccessMessage.textContent = 'OTP sent to your email!';
            
            // Show OTP verification section
            setTimeout(() => {
                requestOtpSection.classList.add('hidden');
                verifyOtpSection.classList.remove('hidden');
            }, 1000);
            
        } catch (error) {
            // Show error message
            console.error('OTP request detailed error:', error);
            requestErrorMessage.textContent = error.message || 'An error occurred';
            requestSuccessMessage.textContent = '';
        }
    });
    
    // Step 2: Verify OTP
    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        verifyErrorMessage.textContent = '';
        verifySuccessMessage.textContent = '';
        
        const email = localStorage.getItem('monaEmail');
        const otp = document.getElementById('otp').value;
        
        console.log('Verifying OTP for email:', email);
        
        if (!email) {
            verifyErrorMessage.textContent = 'Email not found. Please go back and try again.';
            return;
        }
        
        try {
            // Show loading message
            verifySuccessMessage.textContent = 'Verifying OTP...';
            
            // Make API request to verify OTP
            console.log('Making request to:', VERIFY_OTP_ENDPOINT);
            const response = await fetch(VERIFY_OTP_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Mona-Application-Id': MONA_APP_ID
                },
                body: JSON.stringify({
                    email,
                    otp
                })
            });
            
            console.log('OTP verification response status:', response.status);
            const data = await response.json();
            console.log('OTP verification response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `OTP verification failed (Status: ${response.status})`);
            }
            
            // Check if we received the expected tokens - Updated to match actual API response
            if (!data.access) {
                console.warn('No access token found in response:', data);
                throw new Error('Authentication successful but no access token received');
            }
            
            // Store tokens - Updated to match actual API response
            localStorage.setItem('monaAccessToken', data.access);
            if (data.refresh) {
                localStorage.setItem('monaRefreshToken', data.refresh);
            }
            
            // Show success message
            verifySuccessMessage.textContent = 'OTP verified successfully!';
            
            // Update auth-card class for logged-in state
            authCard.classList.remove('login-state');
            authCard.classList.add('logged-in-state');
            
            // Fetch user profile
            await fetchUserProfile(data.access);
            
        } catch (error) {
            // Show error message
            console.error('OTP verification detailed error:', error);
            verifyErrorMessage.textContent = error.message || 'An error occurred during verification';
            verifySuccessMessage.textContent = '';
        }
    });
    
    // Back button
    backToEmailBtn.addEventListener('click', () => {
        verifyOtpSection.classList.add('hidden');
        requestOtpSection.classList.remove('hidden');
        verifyErrorMessage.textContent = '';
        verifySuccessMessage.textContent = '';
    });
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        // Clear local storage
        localStorage.removeItem('monaAccessToken');
        localStorage.removeItem('monaRefreshToken');
        localStorage.removeItem('monaEmail');
        
        // Reset forms
        requestOtpForm.reset();
        verifyOtpForm.reset();
        
        // Clear messages
        requestErrorMessage.textContent = '';
        requestSuccessMessage.textContent = '';
        verifyErrorMessage.textContent = '';
        verifySuccessMessage.textContent = '';
        
        // Update auth-card class for login state
        authCard.classList.remove('logged-in-state');
        authCard.classList.add('login-state');
        
        // Show request OTP section
        userInfoSection.classList.add('hidden');
        verifyOtpSection.classList.add('hidden');
        requestOtpSection.classList.remove('hidden');
        
        // Clear any assets that might be showing
        if (assetsContainer) {
            const assetsGrid = assetsContainer.querySelector('.assets-grid');
            if (assetsGrid) {
                assetsGrid.innerHTML = '';
            }
        }
        
        console.log('User logged out');
    });
    
    // Fetch user profile
    async function fetchUserProfile(accessToken) {
        console.log('Fetching user profile with token:', accessToken.substring(0, 10) + '...');
        
        try {
            console.log('Making request to:', USER_PROFILE_ENDPOINT);
            const response = await fetch(USER_PROFILE_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Mona-Application-Id': MONA_APP_ID
                }
            });
            
            console.log('User profile response status:', response.status);
            
            // Try to parse the response as JSON
            let userData;
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            try {
                userData = JSON.parse(responseText);
                console.log('User profile response data:', userData);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error('Invalid response format from server');
            }
            
            if (!response.ok) {
                throw new Error(userData.message || `Failed to fetch user profile (Status: ${response.status})`);
            }
            
            // Display user info
            displayUserInfo(userData);
            
            // Store wallet objects for later use
            let walletObjects = [];
            if (userData.wallets && userData.wallets.length > 0) {
                console.log('Found wallets in user data:', userData.wallets);
                
                // Convert wallet addresses to wallet objects if they're strings
                walletObjects = userData.wallets.map(wallet => {
                    if (typeof wallet === 'string') {
                        // Default to Ethereum for now, as we don't know the actual type
                        return {
                            address: wallet,
                            type: 'ethereum'  // Default to Ethereum
                        };
                    } else if (typeof wallet === 'object' && wallet !== null) {
                        // Ensure the wallet object has the required properties
                        return {
                            address: wallet.address || '',
                            type: wallet.type || 'ethereum'
                        };
                    }
                    return null;
                }).filter(wallet => wallet && wallet.address); // Filter out invalid wallets
                
                console.log('Processed wallet objects:', walletObjects);
                
                if (walletObjects.length > 0) {
                    // Store wallet objects in a data attribute on the wallets container
                    walletsContainer.dataset.wallets = JSON.stringify(walletObjects);
            } else {
                    console.log('No valid wallets found after processing');
                    walletsContainer.innerHTML = '<p class="no-wallets">No valid wallets found.</p>';
                }
            } else {
                console.log('No wallets found');
                walletsContainer.innerHTML = '<p class="no-wallets">No wallets connected.</p>';
            }
            
            // Fetch and combine all assets (community tokens and user tokens)
            await fetchAllAssets(accessToken, walletObjects);
            
        } catch (error) {
            console.error('Error fetching user profile:', error);
            
            // If token is invalid, logout
            if (error.message.includes('unauthorized') || error.message.includes('token')) {
                console.log('Authentication issue detected, logging out');
                logoutBtn.click();
            }
        }
    }
    
    // Display user info
    function displayUserInfo(userData) {
        console.log('Displaying user info:', userData);
        
        userEmailSpan.textContent = userData.email || 'N/A';
        userUsernameSpan.textContent = userData.username || 'N/A';
        userNameSpan.textContent = userData.name || 'N/A';
        
        // Show user info section
        requestOtpSection.classList.add('hidden');
        verifyOtpSection.classList.add('hidden');
        userInfoSection.classList.remove('hidden');
    }
    
    // Fetch community tokens
    async function fetchCommunityTokens(accessToken) {
        console.log('Fetching community tokens');
        
        try {
            // Show loading message in assets container
            const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
            assetsGrid.innerHTML = '<p class="loading-message">Loading community tokens...</p>';
            
            // Try different chain IDs for community tokens
            const chainIds = ['1', '137', '80001', '5', '42161', '10', '8453'];
            let communityTokens = [];
            
            // Try each chain ID
            for (const chainId of chainIds) {
                // Make API request to get community tokens with chain ID
                const url = `${COMMUNITY_TOKENS_ENDPOINT}/${chainId}/community`;
                console.log(`Making request to: ${url}`);
                
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'X-Mona-Application-Id': MONA_APP_ID
                        }
                    });
                    
                    console.log(`Community tokens response status for chain ${chainId}:`, response.status);
                    
                    if (!response.ok) {
                        console.warn(`Failed to fetch community tokens for chain ${chainId}: ${response.status}`);
                        continue;
                    }
                    
                    const responseData = await response.json();
                    console.log(`Community tokens response data for chain ${chainId}:`, responseData);
                    
                    // Check if the response contains tokens array
                    const tokensData = responseData.tokens || responseData;
                    
                    if (tokensData && Array.isArray(tokensData) && tokensData.length > 0) {
                        // Process tokens to add community flag and chain ID
                        const chainTokens = tokensData.map(token => ({
                            ...token,
                            isCommunityToken: true,
                            chainId: chainId
                        }));
                        
                        communityTokens.push(...chainTokens);
                        console.log(`Found ${chainTokens.length} community tokens for chain ${chainId}`);
                    }
                } catch (error) {
                    console.error(`Error fetching community tokens for chain ${chainId}:`, error);
                }
            }
            
            // Display community tokens if any were found
            if (communityTokens.length > 0) {
                console.log(`Total community tokens found: ${communityTokens.length}`);
                displayCommunityTokens(communityTokens, accessToken);
            } else {
                displayNoAssets('No community tokens found across any chains.');
            }
            
        } catch (error) {
            console.error('Error fetching community tokens:', error);
            const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
            assetsGrid.innerHTML = '<p class="error-message">Error loading community tokens. Please try again later.</p>';
        }
    }
    
    // Display community tokens
    async function displayCommunityTokens(tokens, accessToken) {
        console.log('Displaying community tokens:', tokens);
        
        // Get the assets grid container
        const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
        assetsGrid.innerHTML = '';
        
        try {
            // Create a simple asset count indicator with green left border
            const assetCountIndicator = document.createElement('div');
            assetCountIndicator.className = 'asset-count-indicator community';
            assetCountIndicator.innerHTML = `
                <h2>Community Tokens</h2>
                <p>${tokens.length} tokens</p>
            `;
            assetsGrid.appendChild(assetCountIndicator);
            
            // Process tokens in batches
            const batchSize = 10;
            for (let i = 0; i < tokens.length; i += batchSize) {
                const batch = tokens.slice(i, i + batchSize);
                
                // Process each token in the batch
                await Promise.all(batch.map(async (token) => {
                    // Create token card
                    const tokenCard = document.createElement('div');
                    tokenCard.className = 'asset-card community-token';
                    
                    // Token name
                    const tokenName = document.createElement('h4');
                    tokenName.textContent = token.name || token.metadata?.name || `Token #${token.token_id || token.tokenId}`;
                    tokenCard.appendChild(tokenName);
                    
                    // Try to get image or animation URL
                    let imageUrl = null;
                    let animationUrl = null;
                    let is3DModel = false;
                    
                    if (token.image) {
                        imageUrl = token.image;
                    } else if (token.metadata && token.metadata.image) {
                        imageUrl = token.metadata.image;
                    } else if (token.metadata && token.metadata.animation_url) {
                        animationUrl = token.metadata.animation_url;
                    }
                    
                    // Use the best available URL
                    const displayUrl = imageUrl || animationUrl;
                    
                    // Check if it's a 3D model
                    if (displayUrl) {
                        is3DModel = displayUrl.endsWith('.glb') || displayUrl.endsWith('.gltf');
                    }
                    
                    // Token image or 3D preview
                    if (displayUrl) {
                        if (is3DModel) {
                            // 3D model preview
                            const modelPlaceholder = document.createElement('div');
                            modelPlaceholder.className = 'model-placeholder';
                            modelPlaceholder.textContent = '3D Model';
                            modelPlaceholder.title = displayUrl;
                            
                            // Store the model URL as a data attribute
                            modelPlaceholder.dataset.modelUrl = displayUrl;
                            
                            // Add click event to load model into 3D scene
                            modelPlaceholder.addEventListener('click', () => {
                                loadModelIntoScene(displayUrl);
                            });
                            
                            tokenCard.appendChild(modelPlaceholder);
                            
                            // Also make the entire card clickable for 3D models
                            tokenCard.addEventListener('click', (e) => {
                                // Only trigger if the click wasn't on a child element with its own click handler
                                if (e.target === tokenCard) {
                                    loadModelIntoScene(displayUrl);
                                }
                            });
                        } else {
                            // Image preview
                            const tokenImage = document.createElement('img');
                            tokenImage.src = displayUrl;
                            tokenImage.alt = tokenName.textContent;
                            tokenImage.className = 'asset-image';
                            tokenImage.onerror = function() {
                                console.warn(`Failed to load image: ${displayUrl}`);
                                this.onerror = null;
                                this.src = ''; // Clear the src to prevent further attempts
                                this.style.display = 'none';
                                
                                // Create fallback element
                                const noImage = document.createElement('div');
                                noImage.className = 'no-image';
                                noImage.textContent = 'Image failed to load';
                                this.parentNode.insertBefore(noImage, this);
                            };
                            tokenCard.appendChild(tokenImage);
                        }
                    } else {
                        // Fallback if no image or animation URL
                        const noImage = document.createElement('div');
                        noImage.className = 'no-image';
                        noImage.textContent = 'No preview available';
                        tokenCard.appendChild(noImage);
                    }
                    
                    // Add 3D model indicator if applicable
                    if (is3DModel) {
                        const modelInfo = document.createElement('p');
                        modelInfo.className = 'model-info';
                        modelInfo.textContent = '3D Model (Click to view)';
                        tokenCard.appendChild(modelInfo);
                    }
                    
                    // Add to grid
                    assetsGrid.appendChild(tokenCard);
                }));
            }
            
        } catch (error) {
            console.error('Error displaying community tokens:', error);
            assetsGrid.innerHTML = '<p class="error-message">Error displaying community tokens. Please try again later.</p>';
        }
    }
    
    // Display no assets message
    function displayNoAssets(message = 'No assets found.') {
        const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
        assetsGrid.innerHTML = `<p class="no-assets">${message}</p>`;
    }
    
    // Helper function to shorten addresses
    function shortenAddress(address) {
        if (!address) return 'Unknown';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    
    // Fetch all assets across all wallets
    async function fetchAllWalletAssets(accessToken, wallets) {
        console.log('Fetching assets across all wallets');
        
        // Show loading message
        const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
        assetsGrid.innerHTML = '<p class="loading-message">Loading all your assets...</p>';
        
        try {
        // Initialize assets array
        const assets = [];
        
            // Process each wallet
            for (const wallet of wallets) {
                if (!wallet || !wallet.address) {
                    console.warn('Invalid wallet object, skipping:', wallet);
                    continue;
                }
                
                console.log(`Fetching tokens for wallet: ${wallet.address}`);
                
                // Try different chain IDs for each wallet
                const chainIds = ['1', '137', '80001', '5', '42161', '10', '8453'];
                
                // Get the preferred chain ID based on wallet type, if available
                const preferredChainId = getChainIdForWallet(wallet);
                if (preferredChainId) {
                    // Move the preferred chain ID to the front of the array
                    chainIds.unshift(preferredChainId);
                }
                
                for (const chainId of chainIds) {
                    console.log(`Trying chain ID: ${chainId} for wallet: ${wallet.address}`);
                    
                    // Make API request to get user tokens
                    const tokensUrl = `${USER_TOKENS_ENDPOINT}/${chainId}/${wallet.address}/tokens`;
                    console.log('Making request to:', tokensUrl);
                    
                    try {
                        const response = await fetch(tokensUrl, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                                'X-Mona-Application-Id': MONA_APP_ID
                            }
                        });
                        
                        console.log(`Tokens response status for wallet ${wallet.address} with chainId ${chainId}:`, response.status);
                        
                        if (!response.ok) {
                            console.warn(`Failed to fetch tokens for wallet ${wallet.address} with chainId ${chainId}: ${response.status}`);
                            continue;
                        }
                        
                        const responseData = await response.json();
                        console.log(`Tokens response data for wallet ${wallet.address} with chainId ${chainId}:`, responseData);
                        
                        // Check if the response contains tokens array
                        const tokensData = responseData.tokens || responseData;
                        
                        // Add tokens to assets array
                        if (tokensData && Array.isArray(tokensData) && tokensData.length > 0) {
                            const walletTokens = tokensData.map(token => ({
                                ...token,
                                walletAddress: wallet.address,
                                walletType: wallet.type,
                                chainId: chainId
                            }));
                            
                            assets.push(...walletTokens);
                            
                            console.log(`Found ${tokensData.length} tokens for wallet ${wallet.address} with chainId ${chainId}`);
                            
                            // Update the loading message to show progress
                            const loadingMessage = assetsGrid.querySelector('.loading-message');
                            if (loadingMessage) {
                                loadingMessage.textContent = `Loading assets... Found ${assets.length} so far`;
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching tokens for wallet ${wallet.address} with chainId ${chainId}:`, error);
                    }
                }
            }
            
            console.log(`Total assets found across all wallets: ${assets.length}`);
            
            // Display assets
            if (assets.length > 0) {
                displayAllWalletAssets(assets, accessToken);
            } else {
                assetsGrid.innerHTML = '<p class="no-assets">No assets found across any of your wallets.</p>';
            }
            
        } catch (error) {
            console.error('Error fetching assets across all wallets:', error);
            const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
            assetsGrid.innerHTML = '<p class="error-message">Error loading assets. Please try again later.</p>';
        }
    }
    
    // Display all assets across all wallets
    async function displayAllWalletAssets(assets, accessToken) {
        console.log('Displaying all assets across wallets:', assets);
        
        // Get the assets grid container
        const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
        assetsGrid.innerHTML = '';
        
        try {
            // Create a simple asset count indicator with blue left border
            const assetCountIndicator = document.createElement('div');
            assetCountIndicator.className = 'asset-count-indicator';
            assetCountIndicator.innerHTML = `
                <h2>My Tokens</h2>
                <p>${assets.length} assets across all wallets</p>
            `;
            assetsGrid.appendChild(assetCountIndicator);
            
            // Process assets in batches
            const batchSize = 10;
            for (let i = 0; i < assets.length; i += batchSize) {
                const batch = assets.slice(i, i + batchSize);
                
                // Process each asset in the batch
                await Promise.all(batch.map(async (asset) => {
                    // Create asset card
                    const assetCard = document.createElement('div');
                    assetCard.className = 'asset-card';
                    
                    // Asset name
                    const assetName = document.createElement('h4');
                    assetName.textContent = asset.name || asset.metadata?.name || `Token #${asset.token_id || asset.tokenId}`;
                    assetCard.appendChild(assetName);
                    
                    // Try to get animation URL
                    let animationUrl = null;
                    let imageUrl = null;
                    let is3DModel = false;
                    
                    // Check if the asset already has an image URL from the API
                    if (asset.image) {
                        imageUrl = asset.image;
                        console.log('Using image URL from asset:', imageUrl);
                    } else if (asset.metadata && asset.metadata.image) {
                        imageUrl = asset.metadata.image;
                        console.log('Using image URL from metadata:', imageUrl);
                    } else if (asset.metadata && asset.metadata.animation_url) {
                        animationUrl = asset.metadata.animation_url;
                        console.log('Using animation URL from metadata:', animationUrl);
                    } else if (asset.imageSmall || asset.imageLarge) {
                        imageUrl = asset.imageLarge || asset.imageSmall;
                        console.log('Using image URL from asset fields:', imageUrl);
                    } else {
                        // If no image in metadata, try to fetch it
                        const tokenId = asset.token_id || asset.tokenId;
                        const contract = asset.contract_address || asset.contract;
                        
                        if (tokenId && contract && asset.chainId) {
                            // Create a token object with the necessary properties
                            const tokenObj = {
                                tokenId: tokenId,
                                contract: contract,
                                chainId: asset.chainId
                            };
                            
                            animationUrl = await fetchTokenAnimation(accessToken, tokenObj);
                        }
                    }
                    
                    // Use the best available URL
                    const displayUrl = imageUrl || animationUrl;
                    
                    // Check if it's a 3D model
                    if (displayUrl) {
                        is3DModel = displayUrl.endsWith('.glb') || displayUrl.endsWith('.gltf');
                    }
                    
                    // Asset image or 3D preview
                    if (displayUrl) {
                        if (is3DModel) {
                            // 3D model preview
                            const modelPlaceholder = document.createElement('div');
                            modelPlaceholder.className = 'model-placeholder';
                            modelPlaceholder.textContent = '3D Model';
                            modelPlaceholder.title = displayUrl;
                            
                            // Store the model URL as a data attribute
                            modelPlaceholder.dataset.modelUrl = displayUrl;
                            
                            // Add click event to load model into 3D scene
                            modelPlaceholder.addEventListener('click', () => {
                                loadModelIntoScene(displayUrl);
                            });
                            
                            assetCard.appendChild(modelPlaceholder);
                            
                            // Also make the entire card clickable for 3D models
                            assetCard.addEventListener('click', (e) => {
                                // Only trigger if the click wasn't on a child element with its own click handler
                                if (e.target === assetCard) {
                                    loadModelIntoScene(displayUrl);
                                }
                            });
                        } else {
                            // Image preview
                            const assetImage = document.createElement('img');
                            assetImage.src = displayUrl;
                            assetImage.alt = assetName.textContent;
                            assetImage.className = 'asset-image';
                            assetImage.onerror = function() {
                                console.warn(`Failed to load image: ${displayUrl}`);
                                this.onerror = null;
                                this.src = ''; // Clear the src to prevent further attempts
                                this.style.display = 'none';
                                
                                // Create fallback element
                                const noImage = document.createElement('div');
                                noImage.className = 'no-image';
                                noImage.textContent = 'Image failed to load';
                                this.parentNode.insertBefore(noImage, this);
                            };
                            assetCard.appendChild(assetImage);
                        }
                    } else {
                        // Fallback if no animation URL
                        const noImage = document.createElement('div');
                        noImage.className = 'no-image';
                        noImage.textContent = 'No preview available';
                        assetCard.appendChild(noImage);
                    }
                    
                    // Add 3D model indicator if applicable
                    if (is3DModel) {
                        const modelInfo = document.createElement('p');
                        modelInfo.className = 'model-info';
                        modelInfo.textContent = '3D Model (Click to view)';
                        modelInfo.style.color = '#3498db';
                        modelInfo.style.fontWeight = 'bold';
                        assetCard.appendChild(modelInfo);
                    }
                    
                    // Add to grid
                    assetsGrid.appendChild(assetCard);
                }));
            }
            
        } catch (error) {
            console.error('Error displaying all assets:', error);
            assetsGrid.innerHTML = '<p class="error-message">Error displaying assets. Please try again later.</p>';
        }
    }
    
    // Get chain ID for wallet type
    function getChainIdForWallet(wallet) {
        // Map wallet types to chain IDs based on MONA API documentation
        const chainMap = {
            'ethereum': '1',      // Ethereum Mainnet
            'polygon': '137',     // Polygon Mainnet
            'mumbai': '80001',    // Polygon Mumbai Testnet
            'goerli': '5',        // Ethereum Goerli Testnet
            'arbitrum': '42161',  // Arbitrum
            'optimism': '10',     // Optimism
            'base': '8453'        // Base
        };
        
        // Try to determine chain ID from wallet type
        const walletType = wallet.type ? wallet.type.toLowerCase() : '';
        
        // Return the chain ID if found, otherwise null
        return chainMap[walletType] || null;
    }
    
    // Fetch token animation/model URL
    async function fetchTokenAnimation(accessToken, token) {
        try {
            // Format: https://api.monaverse.com/public/token/{chain_id}/{contract}/{token_id}/animation
            const url = `${TOKEN_ANIMATION_ENDPOINT}/${token.chainId}/${token.contract}/${token.tokenId}/animation`;
            console.log('Fetching animation for token:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Mona-Application-Id': MONA_APP_ID
                }
            });
            
            if (!response.ok) {
                console.warn(`Failed to fetch animation for token: ${token.tokenId} (Status: ${response.status})`);
                return null;
            }
            
            const animationData = await response.json();
            console.log('Animation data:', animationData);
            
            // According to the API docs, the animation URL should be in the 'url' field
            return animationData.url || null;
        } catch (error) {
            console.error('Error fetching token animation:', error);
            return null;
        }
    }
    
    // Fetch and combine all assets (community tokens and user tokens)
    async function fetchAllAssets(accessToken, wallets) {
        console.log('Fetching all assets (community tokens and user tokens)');
        
        // Show loading message
        const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
        assetsGrid.innerHTML = '<p class="loading-message">Loading all assets...</p>';
        
        try {
            // Initialize assets arrays
            const communityTokens = [];
            const userTokens = [];
            
            // 1. Fetch community tokens
            const chainIds = ['1', '137', '80001', '5', '42161', '10', '8453'];
            
            // Fetch community tokens for each chain
            for (const chainId of chainIds) {
                const url = `${COMMUNITY_TOKENS_ENDPOINT}/${chainId}/community`;
                console.log(`Making request to: ${url}`);
                
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'X-Mona-Application-Id': MONA_APP_ID
                        }
                    });
                    
                    if (!response.ok) {
                        console.warn(`Failed to fetch community tokens for chain ${chainId}: ${response.status}`);
                        continue;
                    }
                    
                    const responseData = await response.json();
                    const tokensData = responseData.tokens || responseData;
                    
                    if (tokensData && Array.isArray(tokensData) && tokensData.length > 0) {
                        // Process tokens to add community flag and chain ID
                        const chainTokens = tokensData.map(token => ({
                            ...token,
                            isCommunityToken: true,
                            chainId: chainId
                        }));
                        
                        communityTokens.push(...chainTokens);
                        console.log(`Found ${chainTokens.length} community tokens for chain ${chainId}`);
                    }
                } catch (error) {
                    console.error(`Error fetching community tokens for chain ${chainId}:`, error);
                }
            }
            
            // 2. Fetch user tokens if wallets exist
            if (wallets && wallets.length > 0) {
                for (const wallet of wallets) {
                    if (!wallet || !wallet.address) {
                        console.warn('Invalid wallet object, skipping:', wallet);
                        continue;
                    }
                    
                    console.log(`Fetching tokens for wallet: ${wallet.address}`);
                    
                    // Get the preferred chain ID based on wallet type, if available
                    const preferredChainId = getChainIdForWallet(wallet);
                    const orderedChainIds = [...chainIds];
                    
                    if (preferredChainId) {
                        // Move the preferred chain ID to the front of the array
                        orderedChainIds.unshift(preferredChainId);
                    }
                    
                    for (const chainId of orderedChainIds) {
                        console.log(`Trying chain ID: ${chainId} for wallet: ${wallet.address}`);
                        
                        // Make API request to get user tokens
                        const tokensUrl = `${USER_TOKENS_ENDPOINT}/${chainId}/${wallet.address}/tokens`;
                        
                        try {
                            const response = await fetch(tokensUrl, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                    'X-Mona-Application-Id': MONA_APP_ID
                                }
                            });
                            
                            if (!response.ok) {
                                console.warn(`Failed to fetch tokens for wallet ${wallet.address} with chainId ${chainId}: ${response.status}`);
                                continue;
                            }
                            
                            const responseData = await response.json();
                            const tokensData = responseData.tokens || responseData;
                            
                            if (tokensData && Array.isArray(tokensData) && tokensData.length > 0) {
                                const walletTokens = tokensData.map(token => ({
                                    ...token,
                                    walletAddress: wallet.address,
                                    walletType: wallet.type,
                                    chainId: chainId,
                                    isUserToken: true
                                }));
                                
                                userTokens.push(...walletTokens);
                                console.log(`Found ${tokensData.length} tokens for wallet ${wallet.address} with chainId ${chainId}`);
                            }
                        } catch (error) {
                            console.error(`Error fetching tokens for wallet ${wallet.address} with chainId ${chainId}:`, error);
                        }
                    }
                }
            }
            
            // 3. Combine all tokens
            const allAssets = [...communityTokens, ...userTokens];
            console.log(`Total assets found: ${allAssets.length} (${communityTokens.length} community tokens, ${userTokens.length} user tokens)`);
            
            // 4. Display all assets
            if (allAssets.length > 0) {
                displayCombinedAssets(allAssets, accessToken);
        } else {
                assetsGrid.innerHTML = '<p class="no-assets">No assets found.</p>';
            }
            
        } catch (error) {
            console.error('Error fetching all assets:', error);
            const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
            assetsGrid.innerHTML = '<p class="error-message">Error loading assets. Please try again later.</p>';
        }
    }
    
    // Display combined assets (community tokens and user tokens)
    async function displayCombinedAssets(assets, accessToken) {
        console.log('Displaying combined assets:', assets);
        
        // Get the assets grid container
        const assetsGrid = assetsContainer.querySelector('.assets-grid') || assetsContainer;
        assetsGrid.innerHTML = '';
        
        try {
            // Create a simple asset count indicator without the header
            const assetCountIndicator = document.createElement('div');
            assetCountIndicator.className = 'asset-count-indicator';
            assetCountIndicator.innerHTML = `
                <p>(${assets.length}) assets</p>
            `;
            assetsGrid.appendChild(assetCountIndicator);
            
            // Process assets in batches
            const batchSize = 10;
            for (let i = 0; i < assets.length; i += batchSize) {
                const batch = assets.slice(i, i + batchSize);
                
                // Process each asset in the batch
                await Promise.all(batch.map(async (asset) => {
                    // Create asset card
                    const assetCard = document.createElement('div');
                    assetCard.className = asset.isCommunityToken ? 'asset-card community-token' : 'asset-card';
                    
                    // Asset name
                    const assetName = document.createElement('h4');
                    assetName.textContent = asset.name || asset.metadata?.name || `Token #${asset.token_id || asset.tokenId}`;
                    assetCard.appendChild(assetName);
                    
                    // Try to get animation URL or image URL
                    let animationUrl = null;
                    let imageUrl = null;
                    let is3DModel = false;
                    
                    // Check if the asset already has an image URL from the API
                    if (asset.image) {
                        imageUrl = asset.image;
                    } else if (asset.metadata && asset.metadata.image) {
                        imageUrl = asset.metadata.image;
                    } else if (asset.metadata && asset.metadata.animation_url) {
                        animationUrl = asset.metadata.animation_url;
                    } else if (asset.imageSmall || asset.imageLarge) {
                        imageUrl = asset.imageLarge || asset.imageSmall;
                    } else {
                        // If no image in metadata, try to fetch it
                        const tokenId = asset.token_id || asset.tokenId;
                        const contract = asset.contract_address || asset.contract;
                        
                        if (tokenId && contract && asset.chainId) {
                            // Create a token object with the necessary properties
                            const tokenObj = {
                                tokenId: tokenId,
                                contract: contract,
                                chainId: asset.chainId
                            };
                            
                            animationUrl = await fetchTokenAnimation(accessToken, tokenObj);
                        }
                    }
                    
                    // Use the best available URL
                    const displayUrl = imageUrl || animationUrl;
                    
                    // Check if it's a 3D model
                    if (displayUrl) {
                        is3DModel = displayUrl.endsWith('.glb') || displayUrl.endsWith('.gltf');
                    }
                    
                    // Asset image or 3D preview
                    if (displayUrl) {
                        if (is3DModel) {
                            // 3D model preview
                            const modelPlaceholder = document.createElement('div');
                            modelPlaceholder.className = 'model-placeholder';
                            modelPlaceholder.textContent = '3D Model';
                            modelPlaceholder.title = displayUrl;
                            
                            // Store the model URL as a data attribute
                            modelPlaceholder.dataset.modelUrl = displayUrl;
                            
                            // Add click event to load model into 3D scene
                            modelPlaceholder.addEventListener('click', () => {
                                loadModelIntoScene(displayUrl);
                            });
                            
                            assetCard.appendChild(modelPlaceholder);
                            
                            // Also make the entire card clickable for 3D models
                            assetCard.addEventListener('click', (e) => {
                                // Only trigger if the click wasn't on a child element with its own click handler
                                if (e.target === assetCard) {
                                    loadModelIntoScene(displayUrl);
                                }
                            });
                        } else {
                            // Image preview
                            const assetImage = document.createElement('img');
                            assetImage.src = displayUrl;
                            assetImage.alt = assetName.textContent;
                            assetImage.className = 'asset-image';
                            assetImage.onerror = function() {
                                console.warn(`Failed to load image: ${displayUrl}`);
                                this.onerror = null;
                                this.src = ''; // Clear the src to prevent further attempts
                                this.style.display = 'none';
                                
                                // Create fallback element
                                const noImage = document.createElement('div');
                                noImage.className = 'no-image';
                                noImage.textContent = 'Image failed to load';
                                this.parentNode.insertBefore(noImage, this);
                            };
                            assetCard.appendChild(assetImage);
                        }
                    } else {
                        // Fallback if no animation URL
                        const noImage = document.createElement('div');
                        noImage.className = 'no-image';
                        noImage.textContent = 'No preview available';
                        assetCard.appendChild(noImage);
                    }
                    
                    // Add 3D model indicator if applicable
                    if (is3DModel) {
                        const modelInfo = document.createElement('p');
                        modelInfo.className = 'model-info';
                        modelInfo.textContent = '3D Model (Click to view)';
                        modelInfo.style.color = '#3498db';
                        modelInfo.style.fontWeight = 'bold';
                        assetCard.appendChild(modelInfo);
                    }
                    
                    // Add to grid
                    assetsGrid.appendChild(assetCard);
                }));
            }
            
        } catch (error) {
            console.error('Error displaying combined assets:', error);
            assetsGrid.innerHTML = '<p class="error-message">Error displaying assets. Please try again later.</p>';
        }
    }
}); 