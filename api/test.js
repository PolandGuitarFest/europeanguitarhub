export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Vercel function is working!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
