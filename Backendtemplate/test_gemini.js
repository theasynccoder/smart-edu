import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GROQ_API_KEY;
console.log(`Testing Groq key: ${key?.substring(0, 15)}...`);

try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Write a one-sentence lesson plan intro for teaching Pythagoras theorem.' }],
            max_tokens: 100
        })
    });

    const data = await res.json();
    if (!res.ok) {
        console.log(`❌ ${res.status}:`, data.error?.message);
    } else {
        console.log('✅ GROQ WORKS!');
        console.log('Response:', data.choices[0].message.content);
    }
} catch (e) {
    console.log('❌ Network error:', e.message);
}
