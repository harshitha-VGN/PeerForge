import API from '../api';

// 1. Fetch list of problems for Dashboard
export const fetchProblems = async (limit = 6) => {
  try {
    const response = await API.get(`/problems?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching problems:", error);
    return [];
  }
};

// 2. Fetch specific details for Workspace (THE MISSING FUNCTION)
export const fetchProblemDetails = async (titleSlug) => {
  try {
    const response = await API.get(`/problems/${titleSlug}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching problem details:", error);
    return null;
  }
};