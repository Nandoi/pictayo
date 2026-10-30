import { CameraPreview } from './features/camera/CameraPreview'

function App() {
  return (
    <main className="min-h-screen bg-rose-50 px-6 py-12">
      <div className="mx-auto max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-bold text-rose-600">
          PicTayo
        </h1>

        <CameraPreview />
      </div>
    </main>
  )
}

export default App