const ActivityLog = require('../models/ActivityLog');

const logActivity = async (action, details, type = 'info', user = null, ip = null) => {
  try {
    const userName = user ? user.name : 'النظام';
    
    const log = await ActivityLog.create({
      user: user ? user._id || user.id : null,
      userName,
      action,
      details,
      type,
      ip
    });
    
    // Broadcast the new log to connected admins via socket.io
    global.io?.emit('log_change', log);
    console.log(`📝 Log [${type.toUpperCase()}]: ${action} (${userName}) - ${details}`);
    return log;
  } catch (err) {
    console.error('Failed to save activity log:', err.message);
  }
};

module.exports = logActivity;
