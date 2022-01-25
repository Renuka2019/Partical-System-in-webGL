var canvas = null;
var gl = null;
var canvas_original_width;
var canvas_original_height
var bfullscreen = false;


const WebGLMacros=
{
    RRH_ATTRIBUTE_VERTEX:0,
    RRH_ATTRIBUTE_COLOR:1,
    RRH_ATTRIBUTE_NORMAL:2,
    RRH_ATTRIBUTE_TEXTURE0:3,
};


var vertexShaderObject;
var fragmentShaderObject;
var shaderProgramObject;
var model_matrix_uniform;
var  view_matrix_uniform;
var projection_matrix_uniform;                                                                                                          
var lightDirectionUniform;
var alphaUniform
var vao_square;
var vbo_square_position;
var vbo_square_texture;
var vbo_square_normal;
var vbo_index;
var textureSamplerUniform;


var prespectiveProjectionMatrix = new Matrix4();
var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();

var particle = new Array(500);
var smiley_texture;
var flag=false;
var keypress;
var requestAnimationFrame=window.requestAnimationFrame||
                          window.webkitRequestAnimationFrame||
                          window.mozRequestAnimationFrame||
                          window.oRequestAnimationFrame||
                          window.msRequestAnimationFrame;
  var  cancelAnimationFrame=
                           window.cancelAnimationFrame||
                           window.webkitCancelAnimationFrame||window.webkitCancelAnimationFrame||
                           window.mozCancelRequestAnmationFrame||window.mozCancelAnimationFrame||
                           window.oCancelRequestAnmationFrame||window.oCancelAnmationFrame||
                           window.msCancelRequestAnimationFrame||window.msCanAnimationFrame;                      

function main()
{
    //step 1: get canvas from DOM
     canvas = document.getElementById("RRH");
    if(!canvas)
    {
     console.log("obtaining canvas failed");
    }
     else
     {
     console.log("obtaning canvas succeeded");
     }

       

       canvas_original_width = canvas.width;
       canvas_original_height = canvas.height;

     
      
     

     //Event handling
     window.addEventListener("keydown", keyDown, false);  //window inbuild variable DOM object
     window.addEventListener("click", mouseDown, false);  //js  event two types captured propagation and bubbled propagation false-> bubbling propagation
     window.addEventListener("resize", resize, false);

      init();

      resize();

      draw(); //warm up repaint call
    
}
   


  //full screen
    function toggleFullscreen()
      {
          //multi browser complient 
          var fullscreen_element = document.fullscreenElement ||
                                   document.webkitFullscreenElement||
                                   document.mozFullScreenElement||
                                   document.msFullscreenElement||
                                   null;

           if(fullscreen_element==null)
           {
               if(canvas.requestFullscreen)
               {
                   canvas.requestFullscreen();
               }
               else if(canvas.webkitRequestFullscreen)
               {
                   canvas.webkitRequestFullscreen();
               }
               else if(canvas.mozRequestFullScreen)
               {
                   canvas.mozRequestFullScreen();
               }
               else if(canvas.msRequestFullscreen)
               {
                   canvas.msRequestFullscreen();
               }
               bfullscreen = true;
           }
           else
           {
              if(document.exitFullscreen)
              {
                  document.exitFullscreen();
              }
              else if(document.webkitExitFullscreen)
              {
                 document.webkitExitFullscreen();
              }  
              else if(document.mozCancelFullScreen)
              {
                 document.mozCancelFullScreen();
              }
              else if(document.msExitFullscreen)
              {
                  document.msExitFullscreen();
              }
              bfullscreen = false;
           }
      }
 
function init()
{
   //step 3:get context from canvas
   gl = canvas.getContext("webgl2");
   if(!gl)
   console.log("webgl2 context failed");
   else
   console.log("webgl2 context succeeded");
   
   gl.viewportWidth = canvas.width;
   gl.viewportHeight = canvas.height;
  
  //vertex shader
  var vertexShaderSourceCode=
  "#version 300 es\n"+
  "\n"+
  "in vec4 vPosition;\n"+
  "in vec2 vTexCoord;\n"+
  "uniform mat4 u_model_matrix;"+
  "uniform mat4 u_view_matrix;"+
  "uniform mat4 u_projection_matrix;"+
  "out vec2 out_texcoord;\n"+
  "uniform vec3 u_lightDir;\n" +
  "void main(void)\n"+
  "{\n"+
  "gl_Position = u_projection_matrix * u_view_matrix * u_model_matrix * vPosition;"+
  "out_texcoord=vTexCoord;\n"+
  "}\n";

  vertexShaderObject =gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShaderObject,vertexShaderSourceCode);
  gl.compileShader(vertexShaderObject);
  if(gl.getShaderParameter(vertexShaderObject,gl.COMPILE_STATUS) == false)
  {
      var error=gl.getShaderInfoLog(vertexShaderObject);
      if(error.length>0)
      {
          alert(error);
          unintialize();
      }
  }

  //fragment shader
  var fragmentShaderSourceCode=
  "#version 300 es\n"+
  "\n"+
  "precision highp float;\n"+
  "in vec2 out_texcoord;\n"+
  "uniform float u_alpha;\n"+
  "uniform sampler2D u_texture_sampler;\n"+
  "out vec4 FragColor;\n"+
  "void main(void)\n"+
  "{\n"+
  "FragColor=texture(u_texture_sampler,out_texcoord)*u_alpha;\n"+
   "}";
  fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShaderObject,fragmentShaderSourceCode);
  gl.compileShader(fragmentShaderObject);
  if(gl.getShaderParameter(fragmentShaderObject,gl.COMPILE_STATUS)==false)
  {
      var error = gl.getShaderInfoLog(fragmentShaderObject);
      if(error.length>0)
      {
          alert(error);
          unintialize();
      }
  }

  //shader program
  shaderProgramObject = gl.createProgram();
  gl.attachShader(shaderProgramObject,vertexShaderObject);
  gl.attachShader(shaderProgramObject,fragmentShaderObject);

  //pre linking
  gl.bindAttribLocation(shaderProgramObject,WebGLMacros.RRH_ATTRIBUTE_VERTEX,"vPosition");
 gl.bindAttribLocation(shaderProgramObject,WebGLMacros.RRH_ATTRIBUTE_TEXTURE0,"vTexCoord");

  //linking
  gl.linkProgram(shaderProgramObject);
  if(!gl.getProgramParameter(shaderProgramObject,gl.LINK_STATUS))
  {
      var error = gl.getProgramInfoLog(shaderProgramObject);
      if(error.length > 0)
      {
          alert(error);
          unintialize();
      }
  }

  //get mvp uniform location
 
 textureSamplerUniform=gl.getUniformLocation(shaderProgramObject,"u_texture_sampler");
 model_matrix_uniform = gl.getUniformLocation(shaderProgramObject, "u_model_matrix");
view_matrix_uniform = gl.getUniformLocation(shaderProgramObject, "u_view_matrix");
projection_matrix_uniform = gl.getUniformLocation(shaderProgramObject, "u_projection_matrix");
lightDirectionUniform = gl.getUniformLocation(shaderProgramObject, "u_lightDir");
alphaUniform = gl.getUniformLocation(shaderProgramObject, "u_alpha");

// Create particles
for (var i = 0; i < particle.length; ++i) {
  particle[i] = new Particle();
  initParticle(particle[i], true);
}


   //vertices,colors, shader attrib,vbo,vao,initialization
  
  var squareVertices=new Float32Array([
    -0.5,-0.5,
      0, 0.5,
    -0.5,0,
     0.5,0.5,
     0,-0.5,
     0.5,0
                                      ]);

  var squareTexcoord=new Float32Array([
    0.0,0.0,
     1.0,0.0,
      1.0,1.0, 
      0.0,1.0
                                     ]);

 var squarNormals = new Float32Array([
     0.0,0.0,1.0,
     0.0,0.0,1.0,
     0.0,0.0,1.0,
     0.0,0.0,1.0,
 ]);

 var indices = new Uint8Array([0,1,2,
                              2,3,0]);

 

   //square
   vao_square=gl.createVertexArray();
   gl.bindVertexArray(vao_square);

   //position
   vbo_square_position=gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER,vbo_square_position);
   gl.bufferData(gl.ARRAY_BUFFER,squareVertices,gl.STATIC_DRAW);
   gl.vertexAttribPointer(WebGLMacros.RRH_ATTRIBUTE_VERTEX,3,gl.FLOAT,false,0,0);
   gl.enableVertexAttribArray(WebGLMacros.RRH_ATTRIBUTE_VERTEX);
   gl.bindBuffer(gl.ARRAY_BUFFER,null);

   vbo_square_texture=gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER,vbo_square_texture);
   gl.bufferData(gl.ARRAY_BUFFER,squareTexcoord,gl.STATIC_DRAW);
   gl.vertexAttribPointer(WebGLMacros.RRH_ATTRIBUTE_TEXTURE0,2,gl.FLOAT,false,0,0);
   gl.enableVertexAttribArray(WebGLMacros.RRH_ATTRIBUTE_TEXTURE0);
   gl.bindBuffer(gl.ARRAY_BUFFER,null);

   vbo_square_normal=gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER,vbo_square_normal);
   gl.bufferData(gl.ARRAY_BUFFER,squarNormals,gl.STATIC_DRAW);
   gl.vertexAttribPointer(WebGLMacros.RRH_ATTRIBUTE_NORMAL,3,gl.FLOAT,false,0,0);
   gl.enableVertexAttribArray(WebGLMacros.RRH_ATTRIBUTE_NORMAL);
   gl.bindBuffer(gl.ARRAY_BUFFER,null);

  
   vbo_index = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbo_index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);


	//set-up depth buffer
	gl.clearDepth(1.0);

	//enable depth testing
	gl.enable(gl.DEPTH_TEST);

	//depth test to do
	gl.depthFunc(gl.LEQUAL);

    //texture
    smiley_texture=gl.createTexture();
    smiley_texture.image = new Image();
    smiley_texture.image.src = "smiley.png";
    smiley_texture.image.onload = function()
    {
       gl.bindTexture(gl.TEXTURE_2D,  smiley_texture);
     //  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,4);

       gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
       gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);

       gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,smiley_texture.image);

       gl.bindTexture(gl.TEXTURE_2D,null);


    }



   gl.clearColor(0.0, 0.0, 0.0, 1.0);
   gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

   
   prespectiveProjectionMatrix.setIdentity();
   //flag=false;
}


//done
function Particle(){
    this.velocity = new Array(3);
    this.position = new Array(3);
    this.angle = 0;
    this.scale = 0;
    this.alpha = 0;
    this.wait = 0;
  }

  function initParticle(p, wait) {
    // Movement speed
    var angle = Math.random() * Math.PI * 2;
  var height = Math.random() * 0.02 + 0.13;
  var speed = Math.random() * 0.01 + 0.02;
  p.velocity[0] = Math.cos(angle) * speed;
  p.velocity[1] = height;
  p.velocity[2] = Math.sin(angle) * speed;

  p.position[0] = Math.random() * 0.2;
  p.position[1] = Math.random() * 0.2;
  p.position[2] = Math.random() * 0.2;

  // Rotation angle
  p.angle = Math.random() * 360;
  // Size
  p.scale = Math.random() * 0.5 + 0.5;
  // Transparency
  p.alpha = 5;
  // In initial stage, vary a time for creation
  if (wait == true) {
    // Time to wait
    p.wait = Math.random() *200;
     }
  }




function resize()
{
    if(bfullscreen == true)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }
   // gl.viewport(0,0,canvas.width, canvas.height);
  
    //prespective projection left,right,bottopm top,near,far
    prespectiveProjectionMatrix.setPerspective(30, canvas.width/canvas.height, 1, 10000);
}

function draw()
{
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); 
    gl.useProgram(shaderProgramObject);
   
   
  // var alpha = 5;
   var lightDir = new Array([0.0, 0.4, 0.6]);
   
  viewMatrix.setLookAt(0, 3, 10,   0, 2, 0,    0, 1, 0);

  gl.uniformMatrix4fv(view_matrix_uniform, false, viewMatrix.elements);
  gl.uniformMatrix4fv(projection_matrix_uniform, false, prespectiveProjectionMatrix.elements);    
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform3fv(lightDirectionUniform,lightDir)
  
  gl.bindTexture(gl.TEXTURE_2D,smiley_texture);
  gl.uniform1i(textureSamplerUniform,0);
  
  for (var i = 0; i < particle.length; ++i) 
  {
    if (particle[i].wait <= 0) 
    {
      modelMatrix.setTranslate(particle[i].position[0], particle[i].position[1], particle[i].position[2]);
    
      // Rotate arounf z-axis to show the front face
       modelMatrix.rotate(particle[i].angle, 0, 0, 1);
    
     var scale = 0.5 * particle[i].scale;
      modelMatrix.scale(scale, scale, scale);
     
    ;
    gl.uniformMatrix4fv(model_matrix_uniform, false, modelMatrix.elements); 
       
    gl.uniform1f(alphaUniform, particle[i].alpha);
    gl.bindVertexArray(vao_square);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    gl.bindVertexArray(null);
 
}
  
  
}

updateParticle(particle);  
    gl.useProgram(null);
   
    requestAnimationFrame(draw,canvas);
}


function degToRad(degree)
{
  return( degree*Math.PI/180.0);
}


function updateParticle(p) {
    for (var i = 0; i < p.length; ++i) {
      // Wait for creation
      if (p[i].wait > 0) {
        p[i].wait--;
        continue;
      }
      // Update a vertex coordinate
      p[i].position[0] += p[i].velocity[0];
      p[i].position[1] += p[i].velocity[1];
      p[i].position[2] += p[i].velocity[2];
  
      // Decreate Y translation
      p[i].velocity[1] -= 0.003;
      // Fading out
      p[i].alpha -= 0.05;
  
      if (p[i].alpha <= 0) {
        initParticle(p[i], false);
      }
    }
  }
  



function unintialize()
{
  

  if(vao_square)
  {
      gl.deleteVertexArray(vao);
      vao_square = null;
  }
  if(vbo_square_position)
  {
      gl.deleteBuffer(vbo_square_position);
      vbo_square_position = null;
  }
  if(vbo_square_texture)
  {
      gl.deleteBuffer(vbo_square_texture);
      vbo_square_texture = null;
  }
  
  if(shaderProgramObject)
  {
      if(fragmentShaderObject)
      {
          gl.detachShader(shaderProgramObject,fragmentShaderObject);
          gl.deleteShader(fragmentShaderObject);
          fragmentShaderObject = null;
      }
       if(vertexShaderObject)
       {
           gl.detachShader(shaderProgramObject,vertexShaderObject);
           gl.deleteShader(vertexShaderObject);
           vertexShaderObject=null;
       }
       gl.deleteProgram(shaderProgramObject);
       shaderProgramObject=null;
      
  }
}

function keyDown(event)
{
   switch(event.keyCode)
   {
       case 27:
           unintialize();
           window.close();
           break;
       case 70:
           toggleFullscreen();
           draw();
           break;

   }     
}
function mouseDown()
{
  //code
}


