type HomeProps = {
  displayName: string
}

const Home = ({ displayName }: HomeProps) => (
  <div className="w-full space-y-8 lg:space-y-10 pt-2">
    <header className="flex flex-col gap-1">
      <p className="text-lg font-bold text-slate-500">Hi, {displayName}</p>
      <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900">
        Welcome to Napindo Software
      </h1>
    </header>

    <div className="grid gap-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-xl bg-slate-100 h-40 card-sheen" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-slate-100 h-[360px] card-sheen" />
        <div className="rounded-xl bg-slate-100 h-[360px] card-sheen" />
      </div>
    </div>
  </div>
)

export default Home
