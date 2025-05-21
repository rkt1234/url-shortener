const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

exports.signup = async (req, res) => {
  console.log("📌 Step 1: Inside signup route");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ Validation failed");
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    console.log("📌 Step 2: Checking existing user");
    const existingUser = await prisma.user.findUnique({ where: { email } });

    console.log("📌 Step 3: Hashing password");
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("📌 Step 4: Creating user");
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    console.log("📌 Step 5: Signing JWT");
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    console.log("✅ Signup successful");
    res.status(201).json({ token });
  } catch (err) {
    console.error("❌ Error in signup:", err);
    res.status(500).json({ error: 'Signup failed' });
  }
};


// exports.signup = async (req, res) => {
//   console.log("huehuehue")
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//   const { email, password } = req.body;
//   try {
//     console.log("++++++++++++++++++++++++++++")
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(409).json({ message: 'Email already exists' });

//     const passwordHash = await bcrypt.hash(password, 10);
//     const user = await prisma.user.create({
//       data: { email, passwordHash },
//     });

//     const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
//     res.status(201).json({ token });
//   } catch (err) {
//     console.log('--------------------------')
//     res.status(500).json({ error: 'Signup failed' });
//   }
// };

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
