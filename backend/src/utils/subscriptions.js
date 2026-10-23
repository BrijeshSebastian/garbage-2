const db = require('../config/db');

/**
 * Returns the currently active, non-expired subscription for a user, or null.
 * Expired subscriptions with end_date < CURDATE() are automatically marked as 'expired'.
 * @param {number} userId - The user ID
 * @returns {Promise<object|null>}
 */
async function getActiveSubscription(userId) {
  try {
    // Automatically transition expired active subscriptions
    await db.query(
      `UPDATE subscriptions 
       SET status = 'expired' 
       WHERE user_id = ? AND status = 'active' AND end_date < CURDATE()`,
      [userId]
    );

    const [rows] = await db.query(
      `SELECT s.*, sp.name AS plan_name, sp.plan_type, sp.price, sp.duration_days
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = ? AND s.status = 'active' AND s.end_date >= CURDATE()
       ORDER BY s.end_date DESC
       LIMIT 1`,
      [userId]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching active subscription:', error);
    throw error;
  }
}

module.exports = {
  getActiveSubscription
};
