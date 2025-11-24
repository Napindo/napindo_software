type HomeProps = {
  displayName: string
}

const Home = ({ displayName }: HomeProps) => (
  <>
    <header className="flex flex-col gap-1 mb-10">
      <p className="text-lg font-bold text-slate-500">Hi, {displayName}</p>
      <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Welcome to Software Napindo</h1>
    </header>

    <div className="grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-2xl bg-slate-100 border border-slate-200 h-36 card-sheen" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-slate-100 border border-slate-200 h-60 md:h-72 card-sheen" />
        <div className="rounded-3xl bg-slate-100 border border-slate-200 h-60 md:h-72 card-sheen" />
      </div>
    </div>
  </>
)

export default Home
