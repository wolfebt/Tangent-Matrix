import { showVTT } from './tm-ui.js';

/**
 * Initializes the application.
 * With Firebase removed, this function now simply creates a mock user
 * and immediately displays the main VTT interface.
 */
const initializeApp = () => {
    // Create a mock user object since authentication has been removed.
    // This provides a default user for the application to work with.
    const mockUser = {
      uid: 'local-user',
      email: `local-user@local.host`,
      displayName: 'local-user'
    };

    // Show the main Virtual Tabletop interface.
    showVTT(mockUser);
};

// Start the application immediately on script load.
initializeApp();
