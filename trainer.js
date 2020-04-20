function say(text) {
    var msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1;
    msg.lang = "en-GB";
    window.speechSynthesis.speak(msg);
}

const response_right = [
    "Exactly, %s!",
    "%s, that's right!",
    "%s is exactly right!",
    "I didn't think you'd know %s!"
]

const response_wrong = [
    "We were looking for %s.",
    "%s would have been right.",
    "Memorize %s for next time.",
    "%s was the answer."
]

const response_continue = [
    "Now for another.",
    "How about this one?",
    "Do you know this one as well?",
    "And this?"
]

class TrainerState {
    constructor() {
        this.next = this;
        this.question = "";
        this.answer = "";
    }
    draw() {

    }
    tick() {

    }
    fail() {

    }
}

class TrainerWelcome extends TrainerState {
    constructor() {
        super();
        this.question = "Are you ready? (Type yes to start!)";
        this.correct_answer = "yes";        
    }
    draw(trainer, ctx) {
        trainer.drawText(this.question, trainer.width/2, -100 + trainer.height/2);
        trainer.drawText(this.answer, trainer.width/2, 100 + trainer.height/2);
    }
    tick(trainer) {
        if (this.answer == this.correct_answer) {
            let q = trainer.getRandomQuestion();
            trainer.clearAnswer();
            this.next = new TrainerQuestion(q.german, q.english);
        }
    }
}

class TrainerQuestion extends TrainerState {
    constructor(question, answer) {
        super();
        this.question = question;
        this.correct_answer = answer;     
        this.failed = false;   
    }
    draw(trainer, ctx) {
        trainer.drawText(this.question, trainer.width/2, -100 + trainer.height/2);
        trainer.drawText(this.answer, trainer.width/2, 100 + trainer.height/2);
    }
    tick() {
        if (this.failed == true) {
            this.next = new TrainerFail(this.correct_answer);
            return;
        }
        if (this.answer == this.correct_answer) {
            this.next = new TrainerCorrect(this.correct_answer);
        }
    }
    fail() {
        this.failed = true;
    }
}

class TrainerCorrect extends TrainerState {
    constructor(answer) {
        super();
        this.duration = 0;
        this.question = "";
        this.correct_answer = answer;

    }
    draw(trainer, ctx) {
        let offs = 25 - this.duration;
        if (offs < 0) { offs = 0 }


        trainer.drawText(this.question, trainer.width/2, (offs*4) +trainer.height/2);
    }    
    tick(trainer) {
        if (this.duration == 0) {
            let rr = response_right[Math.floor(Math.random() * response_right.length)];
            rr = rr.replace("%s", this.correct_answer);
            let rc = response_continue[Math.floor(Math.random() * response_continue.length)];

            this.question = this.correct_answer;
            say(rr+"!"+rc);

            trainer.correctSound();
        }
        this.duration++;
        if (this.duration >= 180) {
            let q = trainer.getRandomQuestion();
            trainer.clearAnswer();
            this.next = new TrainerQuestion(q.german, q.english);
        }
    }
}

class TrainerFail extends TrainerState {
    constructor(answer) {
        super();
        this.duration = 0;
        this.question = "";
        this.correct_answer = answer;

    }
    draw(trainer, ctx) {
        let offs = 25 - this.duration;
        if (offs < 0) { offs = 0 }


        trainer.drawText(this.question, trainer.width/2, (offs*4) +trainer.height/2);
    }    
    tick(trainer) {
        if (this.duration == 0) {
            let rw = response_wrong[Math.floor(Math.random() * response_wrong.length)];
            rw = rw.replace("%s", this.correct_answer);
            let rc = response_continue[Math.floor(Math.random() * response_continue.length)];

            this.question = this.correct_answer;
            say(rw+"!"+rc);

            trainer.wrongSound();
        }
        this.duration++;
        if (this.duration >= 180) {
            let q = trainer.getRandomQuestion();
            trainer.clearAnswer();
            this.next = new TrainerQuestion(q.german, q.english);
        }
    }
}

class Trainer {
    constructor() {
        var _Instance = this;

        this.state = new TrainerWelcome();

        this.canvas = document.querySelector('#app_canvas');
        this.width = 0;
        this.height = 0;

        this.begin = false;
        this.answer = "";

        var _render = function() {
            _Instance.draw();
            window.requestAnimationFrame(_render);
        }
        _render();

        var _tick = function() {
            _Instance.tick();
            window.setTimeout(_tick, 1000/60);
        }
        _tick();

        window.addEventListener('resize', function() {
            _Instance.resize();
        });
        this.resize();

        window.addEventListener('keydown', function(e) {
            _Instance.keyPress(e.key);
            if (e.keyCode == 8) {
                _Instance.keyBackspace();
            }
            if (e.keyCode == 13) {
                _Instance.keyEnter();
            }            
        });
    }
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    draw() {
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0,0,this.width, this.height);

        this.state.draw(this, ctx);
    }
    drawText(text, x, y) {
        var ctx = this.canvas.getContext('2d');
        ctx.font = "72px black Calibri";

        let measure = ctx.measureText(text);
        ctx.fillText(text, x-measure.width/2, y);
    }
    tick() {
        this.state.answer = this.answer;
        this.state.tick(this);
        this.state = this.state.next;
    }
    keyBackspace() {
        if (this.answer.length > 0) {
            this.answer = this.answer.slice(0, this.answer.length-1);
        }
    }
    keyEnter() {
        this.state.fail();
    }
    keyPress(key) {
        let allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '";
        for (let i=0; i<allowed.length; i++) {
            if (key == allowed[i]) {
                this.answer+=key;
            }
        }
    }
    clearAnswer() {
        this.answer = "";
    }
    getRandomQuestion() {
        return vocab[Math.floor(Math.random() * vocab.length)];
    }
    correctSound() {
        new Audio('ding.mp3').play();
    }
    wrongSound() {
        new Audio('fail.mp3').play();
    }    
}

window.addEventListener('load', function() {
    let trainer = new Trainer();
});