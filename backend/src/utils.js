function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function error(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

function paginate(res, { total, page, pageSize, data }) {
  return res.json({ success: true, total, page: Number(page), pageSize: Number(pageSize), data });
}

function buildUpdate(fields, body) {
  const updates = [];
  const values = [];
  for (const [key, col] of Object.entries(fields)) {
    if (body[key] !== undefined) {
      updates.push(`${col} = ?`);
      values.push(body[key]);
    }
  }
  return { updates, values };
}

module.exports = { success, error, paginate, buildUpdate };
