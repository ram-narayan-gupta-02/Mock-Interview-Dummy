from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    role = data.get('role', '')
    type_ = data.get('type', '')
    answers = data.get('answers', [])

    # Simulate "analysis"
    pitch = random.choice(["Steady", "Slightly high", "Calm tone"])
    confidence = random.choice(["High", "Moderate", "Needs improvement"])
    nervousness = random.choice(["None", "Mild", "Noticeable"])
    summary = (
        f"You did well in your {role} interview ({type_}). "
        f"Focus on clarity and consistent tone. Overall performance is promising!"
    )

    return jsonify({
        "pitch": pitch,
        "confidence": confidence,
        "nervousness": nervousness,
        "summary": summary
    })

if __name__ == '__main__':
    app.run(debug=True)
