export default function Login() {
    return (
      <div className="min-h-screen bg-[#f1f6ec] flex relative overflow-hidden">

        {/* เส้นๆ สีเขียว bottom*/}
        <div className="absolute top-[-30px] left-[-200px] w-[900px] h-[900px]  border-[20px] border-[#3ab153] rounded-full 
        border-b-transparent border-r-transparent border-l-transparent rotate-[135deg]"/>

        {/* เส้นเขียว top */}
        <div className="absolute top-[-20px] left-[-20px] w-[800px] h-[800px] border-[20px] border-[#3ab153] rounded-full
        border-l-transparent border-r-transparent border-t-transparent rotate-[135deg]" />

        {/* ตกแต่งซ้ายล่าง */}
        <div className="absolute top-[640px] right-[1250px] w-80 h-80 bg-[#2c9a43] rounded-full z-0 " />
        <div className="absolute top-[740px] right-[1150px] w-40 h-40 bg-[#00bf63] rounded-full z-0" />

        {/* ตกแต่งบนขวา */}
        <div className="absolute top-[-90px] right-[760px] w-64 h-64 bg-[#30a148] rounded-full z-0"/>
        <div className="absolute top-[-90px] right-[900px] w-44 h-44 bg-[#0a5f24] rounded-full z-0"/>

        {/* ฝั่งซ้าย: Logo */}
        <div className="w-1/2 flex justify-center items-center">
          <img
            src="/images/Vertical-logo.png"
            className="max-w-[400px] h-auto"
          />
        </div>
  
        {/* ฝั่งขวา: กล่อง Login */}
        <div className="w-3/4 bg-white flex items-center justify-center rounded-l-[50px] shadow-lg z-10">
          <div className="w-full max-w-[700px] px-20 py-24">
            <h1 className="text-7xl text-[#085e24] font-bold text-center">
              Login
            </h1>
  
            <form className="flex flex-col gap-10 p-10">
              <input
                type="email"
                placeholder="Email"
                className="w-full text-[25px] border-black border-b-2"
              />
  
              <input
                type="password"
                placeholder="Password"
                className="w-full text-[25px] border-black border-b-2"
              />
  
              <a
                href="main.jsx"
                className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-2xl hover:opacity-90 transition block w-full"
              >
                Login
              </a>
  
              <div className="flex justify-between text-sm">
                <label className="flex gap-2">
                  <input type="checkbox" className="accent-[#8cab93]" />
                  Remember me
                </label>
  
                <a
                  href="forgot.jsx"
                  className="hover:text-[#4caf50] transition"
                >
                  Forgot Password?
                </a>
              </div>
  
              <a
                href="sigin"
                className="rounded-full bg-[#8cab93] text-center py-3 px-12 text-lg md:text-2xl hover:opacity-90 transition block mx-auto w-fit"
              >
                Sign in
              </a>
            </form>
          </div>
        </div>
      </div>
    );
  }