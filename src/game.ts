/// <reference path="../lib/phaser.d.ts"/>

module FourierGame {

    class Waveform {
        constructor() {
            if (!this.getCoefficient) {
                this.getCoefficient = i => {
                    return this.getN(i) * Math.PI;
                };
            }
        }
        getN:(i:number) => number;
        getAmplitude:(i:number) => number;
        getCoefficient:(i:number) => number;
    }

    export class FourierGame {
        constructor() {

            this.xPoints = [];
            this.yPoints = [];

            this.game = new Phaser.Game(1400, 800, Phaser.AUTO, 'content', {
                preload: () => this.preload(),
                create: () => this.create(),
                update: () => this.update(),
                render: () => this.render()
            });

            this.period = 10000;
            this.outerRadius = 200;
            this.wheels = [];
            this.numWheels = 50;

            this.waveforms = [
                {
                    getN: i => 1 + 2 * i,
                    getAmplitude: i => {
                        var n = 1 + 2 * i;
                        return 4 / (n * Math.PI);
                    },
                    getCoefficient: i => {
                        return (1 + 2 * i) * Math.PI;
                    }
                },
                {
                    getN: i => 1 + 2 * i,
                    getAmplitude: i => {
                        var n = (1 + 2 * i);
                        return (8 / (Math.PI * Math.PI)) * (Math.pow(-1, (n - 1) / 2) / (n * n));
                    },
                    getCoefficient: i => {
                        return (1 + 2 * i) * Math.PI;
                    }
                },
                {
                    getN: i => 1 + 2 * i,
                    getAmplitude: i => {
                        return 2 / ((1 + i) * Math.PI);
                    },
                    getCoefficient: i => {
                        return (1 + i) * Math.PI;
                    }
                }
            ];

            this.waveformIndex = 0;


        }

        game:Phaser.Game;
        center:Phaser.Point;
        outerRadius:number;
        wheels:Phaser.Circle[];
        numWheels:number;
        xPoints:Phaser.Point[];
        yPoints:Phaser.Point[];
        startTime:number;
        period:number;
        waveforms:Waveform[];
        waveformIndex:number;
        SPACEBAR:Phaser.Key;
        PLUS:Phaser.Key;
        MINUS:Phaser.Key;
        SHIFT:Phaser.Key;


        preload() {
            // load assets when we have them
        }

        create() {
            var waveform = this.waveforms[this.waveformIndex];
            this.center = new Phaser.Point(this.game.world.centerX - 100, this.game.world.centerY);
            for (var i = 0; i < this.numWheels; i++) {
                var radius = 2 * this.outerRadius * Math.abs(waveform.getAmplitude(i + 1));
                var wheel = new Phaser.Circle(0, 0, radius);
                this.wheels.push(wheel);
            }

            this.startTime = this.game.time.now;

            this.SPACEBAR = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.SPACEBAR.onDown.add(() => {
                this.waveformIndex = (this.waveformIndex + 1) % this.waveforms.length;
            }, this);
            this.SHIFT = this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
            this.PLUS = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
            this.MINUS = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
            this.PLUS.onDown.add(() => {
                var count = this.SHIFT.isDown ? 10 : 1;
                this.numWheels += count;

                for (var i = 0; i < count; i++) {
                    this.wheels.push(new Phaser.Circle(0, 0, 10));
                }
            });
            this.MINUS.onDown.add(() => {
                var count = this.SHIFT.isDown ? Math.min(10, this.numWheels - 1) : 1;
                this.numWheels -= count;
                for (var i = 0; i < count; i++) {
                    this.wheels.pop();
                }
            });
        }

        update() {
            var waveform = this.waveforms[this.waveformIndex];

            var t = this.game.time.now;

            for (var i = 0; i < this.wheels.length; i++) {
                var wheel = this.wheels[i];
                var parentWheelX = (i == 0) ? this.center.x : this.wheels[i - 1].x;
                var parentWheelY = (i == 0) ? this.center.y : this.wheels[i - 1].y;
                var amp = waveform.getAmplitude(i);
                var coeff = waveform.getCoefficient(i);
                var x = Math.pow(-1, i) * amp * Math.cos(coeff * t / this.period);
                var y = amp * Math.sin(coeff * t / this.period);
                wheel.x = parentWheelX + this.outerRadius * x;
                wheel.y = parentWheelY + this.outerRadius * y;
                wheel.radius = Math.max(this.outerRadius * Math.abs(waveform.getAmplitude(i + 1)), 1);
            }
        }

        render() {

            var waveform = this.waveforms[this.waveformIndex];

            // render wheel projections
            for (var i = 0; i < this.wheels.length; i++) {
                var wheel = this.wheels[i];
                var v = i * 1.0 / (this.wheels.length - 1);

                v = Math.pow(v, 0.333);

                var rgb = [
                    v,
                    1 - v * v,
                    1 - v
                ];

                var color = '#' + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);

                var projectionLength = Math.max(wheel.diameter, 1);

                var rectWidth = 4;
                var rect = new Phaser.Rectangle(
                    this.game.world.bounds.right - rectWidth - (rectWidth * (i + 1)),
                    wheel.y - wheel.radius,
                    rectWidth - 1,
                    projectionLength);
                this.game.debug.geom(rect, color);

                rect = new Phaser.Rectangle(
                    wheel.x - wheel.radius,
                    this.game.world.bounds.top + rectWidth + (rectWidth * (i + 1)),
                    projectionLength,
                    rectWidth - 1
                );
                this.game.debug.geom(rect, color);
            }

            // render big central wheel
            var wheel = new Phaser.Circle(this.center.x, this.center.y, 2 * this.outerRadius * waveform.getAmplitude(0));
            this.game.debug.geom(wheel, '#808080');

            // render all the other wheels
            for (var i = 0; i < this.wheels.length; i++) {
                var wheel = this.wheels[i];
                var v = i * 1.0 / (this.wheels.length - 1);

                v = Math.pow(v, 0.333);

                var rgb = [
                    v,
                    1 - v * v,
                    1 - v
                ];

                var color = '#' + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);

                this.game.debug.geom(wheel, color);
            }

            var wheel = this.wheels[this.wheels.length - 1];

            var t = this.game.time.now;
            var x = (wheel.x - this.center.x) / this.outerRadius;
            var y = (wheel.y - this.center.y) / this.outerRadius;
            var newXPoint = new Phaser.Point(t, x);
            var newYPoint = new Phaser.Point(t, y);
            var graphBounds = new Phaser.Rectangle(
                this.game.world.bounds.left + 50,
                this.game.world.bounds.bottom - 150,
                this.game.world.bounds.width - 100,
                100
            );

            this.xPoints.push(newXPoint);
            this.yPoints.push(newYPoint);
            while (this.xPoints.length > 0 && (this.xPoints[0].x - this.game.time.now) / 1000.0 * 40 < -graphBounds.width) {
                this.xPoints.shift();
            }
            while (this.yPoints.length > 0 && (this.yPoints[0].x - this.game.time.now) / 1000.0 * 40 < -graphBounds.width) {
                this.yPoints.shift();
            }

            this.drawGraphBounds(graphBounds, '#ffffff');
            this.drawGraph(this.xPoints, graphBounds, this.game.time.now, '#00ffff');
            this.drawGraph(this.yPoints, graphBounds, this.game.time.now, '#ffff00');
        }

        drawGraphBounds(bounds:Phaser.Rectangle, color:string='#ffffff') {
            this.game.debug.geom(new Phaser.Line(
                bounds.left,
                bounds.top,
                bounds.left,
                bounds.bottom
            ), color);
            this.game.debug.geom(new Phaser.Line(
                bounds.right,
                bounds.top,
                bounds.right,
                bounds.bottom
            ), color);
            this.game.debug.geom(new Phaser.Line(
                bounds.left,
                bounds.top,
                bounds.right,
                bounds.top
            ), color);
            this.game.debug.geom(new Phaser.Line(
                bounds.left,
                bounds.bottom,
                bounds.right,
                bounds.bottom
            ), color);
            this.game.debug.geom(new Phaser.Line(
                bounds.left,
                bounds.centerY,
                bounds.right,
                bounds.centerY
            ), color);
        }

        drawGraph(points:Phaser.Point[], bounds:Phaser.Rectangle, ref:number, color:string='#00ffff') {
            for (var i = 0; i < this.yPoints.length - 1; i++) {
                var p1 = points[i];
                var p2 = points[i + 1];

                var x1 = (p1.x - ref) / 1000.0 * 40;
                var x2 = (p2.x - ref) / 1000.0 * 40;

                var y1 = 0.5 * bounds.height * p1.y;
                var y2 = 0.5 * bounds.height * p2.y;

                var line = new Phaser.Line(
                    bounds.right + x1,
                    bounds.centerY + y1,
                    bounds.right + x2,
                    bounds.centerY + y2
                );
                this.game.debug.geom(line, color);
            }
        }
    }
}

function hex(fraction:number):string {
    fraction = Math.min(Math.max(fraction, 0), 1);
    var h = Math.round(fraction * 255).toString(16);
    return h.length < 2 ? '0' + h : h;
}
