import React from 'react'

export const LoadingPage: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-black dark:text-gray-50">
      <div className="text-6xl">Loading...</div>
    </div>
  )
}