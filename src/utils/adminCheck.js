const User = require('../models/User');

/**
 * Check if a Slack user has admin privileges
 * @param {string} slackUserId - The Slack user ID to check
 * @returns {Promise<boolean>} - True if user is admin, false otherwise
 */
async function isAdmin(slackUserId) {
  try {
    const user = await User.findOne({ slackUserId, isActive: true });
    return user ? user.isAdmin : false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Middleware-like function to check admin access for Slack commands
 * Returns an object with success/error information
 * @param {string} slackUserId - The Slack user ID to check
 * @param {string} commandName - The name of the command being executed (for error messages)
 * @returns {Promise<{authorized: boolean, message?: string}>}
 */
async function checkAdminAccess(slackUserId, commandName = 'this command') {
  try {
    const user = await User.findOne({ slackUserId, isActive: true });

    if (!user) {
      return {
        authorized: false,
        message: `You must be registered in the system to use ${commandName}. Please contact an administrator.`
      };
    }

    if (!user.isAdmin) {
      return {
        authorized: false,
        message: `Sorry, you don't have permission to use ${commandName}. This command is restricted to administrators only.`
      };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return {
      authorized: false,
      message: 'An error occurred while checking your permissions. Please try again later.'
    };
  }
}

module.exports = {
  isAdmin,
  checkAdminAccess
};
