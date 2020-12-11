package main

import (
	"fmt"
	"strings"
	"time"
	"github.com/gopherjs/gopherjs/js"
	"github.com/gopherjs/webgl"
)

type Lelu struct {
	Running bool

	ticks float64
	fps   int

	fps_ticks int
	fps_time  float64

	render_time float64

	tick_time float64

	startTime float64
	time float64

	document *js.Object
	canvas   *js.Object
	gl *webgl.Context

	renderer Renderer

	stopRender bool
}

func (l *Lelu) resize() {
	l.renderer.width = int(l.document.Get("documentElement").Get("clientWidth").Float() * 0.95)
	l.renderer.height = int(l.document.Get("documentElement").Get("clientHeight").Float() * 0.95)
	l.canvas.Set("width", l.renderer.width)
	l.canvas.Set("height", l.renderer.height)
	print("viewport:", l.renderer.width, l.renderer.height)
}

func (l *Lelu) Start() {
	l.ticks = 0
	l.fps = 0
	l.fps_ticks = 0

	l.Running = true

	l.document = js.Global.Get("document")
	l.canvas = l.document.Call("createElement", "canvas")
	l.document.Get("body").Call("appendChild", l.canvas)

	l.renderer.fragPath = l.canvas.Get("baseURI").String()
	l.renderer.fragPath = strings.Split(l.renderer.fragPath, "$")[1]
	print("shader source:", l.renderer.fragPath)

	l.resize()

	attrs := webgl.DefaultAttributes()
	attrs.Alpha = false
	attrs.Depth = true
	attrs.Antialias = false

	l.gl, _ = webgl.NewContext(l.canvas, attrs)

	l.renderer.init(l.gl)

	l.startTime = timeNow()
	l.main(nil)
}

func timeNow() float64 {
	return (float64)(time.Now().UnixNano()) / 1000000.0
}

func (l *Lelu) main(ftime *js.Object) {
	l.fps_ticks++

	l.time = timeNow() - l.startTime

	if l.time - l.fps_time >= 1000.0 {
		l.fps_time = l.time

		l.fps = l.fps_ticks

		fmt.Printf("fps %d%s%.2f%s%.2f%s", l.fps,
			", rt: ", l.render_time/(float64)(l.fps_ticks), " ms, tt: ",
				l.tick_time/(float64)(l.fps_ticks), " ms\n")

		fmt.Printf("draws: %d%s%d%s%d%s", l.renderer.draws,
			", vertices: ", l.renderer.vertexNum, ", indices: ",
			l.renderer.indexNum, "\n")

		l.render_time = 0
		l.tick_time = 0

		l.fps_ticks = 0
	}

	if !l.stopRender {
		l.render()
	}

	js.Global.Call("requestAnimationFrame", l.main)
}
