// A simple module for interacting with browser local storage.

const MODE_KEY = 'vtt-mode';
const USER_ID_KEY = 'vtt-user-id';
const PROJECTS_KEY = 'vtt-projects';


export const getMode = () => {
  return localStorage.getItem(MODE_KEY) || 'cloud';
};

export const setMode = (mode) => {
  if (mode === 'cloud' || mode === 'local') {
    localStorage.setItem(MODE_KEY, mode);
  } else {
    console.error(`Invalid mode specified: ${mode}. Must be 'cloud' or 'local'.`);
  }
};

export const getLocalUserId = () => {
    return localStorage.getItem(USER_ID_KEY);
}

export const setLocalUserId = (userId) => {
    localStorage.setItem(USER_ID_KEY, userId);
}


// --- Project Save/Load Functionality ---

/**
 * Saves a project's state to local storage.
 * @param {string} projectTitle - The title of the project to save.
 * @param {object} projectState - The current state of the VTT (e.g., tokens, map).
 */
export const saveProject = (projectTitle, projectState) => {
  if (!projectTitle || !projectState) {
    console.error("Project title and state are required to save.");
    return false;
  }
  try {
    const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}');
    projects[projectTitle] = projectState;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    console.log(`Project "${projectTitle}" saved successfully.`);
    return true;
  } catch (error) {
    console.error(`Failed to save project "${projectTitle}":`, error);
    return false;
  }
};

/**
 * Loads a project's state from local storage.
 * @param {string} projectTitle - The title of the project to load.
 * @returns {object|null} The project state object, or null if not found.
 */
export const loadProject = (projectTitle) => {
  try {
    const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}');
    if (projects[projectTitle]) {
      console.log(`Project "${projectTitle}" loaded successfully.`);
      return projects[projectTitle];
    } else {
      console.warn(`Project "${projectTitle}" not found in local storage.`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to load project "${projectTitle}":`, error);
    return null;
  }
};

/**
 * Retrieves a list of all saved project titles.
 * @returns {string[]} An array of project titles.
 */
export const getSavedProjects = () => {
    try {
        const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}');
        return Object.keys(projects);
    } catch (error) {
        console.error("Failed to retrieve saved projects:", error);
        return [];
    }
};

/**
 * Clears all saved projects from local storage.
 */
export const clearProjects = () => {
    try {
        localStorage.removeItem(PROJECTS_KEY);
        console.log("All local projects have been cleared.");
    } catch (error) {
        console.error("Failed to clear projects from local storage:", error);
    }
};
