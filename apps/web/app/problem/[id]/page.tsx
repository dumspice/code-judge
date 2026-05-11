import ProblemWorkspace from "./components/ProblemWorkspace";

export default function ProblemPage() {
  const mockProblem = {
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
      },
    ],
  };

  return <ProblemWorkspace problem={mockProblem} />;
}