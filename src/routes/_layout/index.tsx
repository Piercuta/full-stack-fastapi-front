import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Skeleton,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import useAuth from "@/hooks/useAuth"
import {
  type DashboardStats,
  fetchDashboardStats,
} from "@/services/dashboardService"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="md"
      p={4}
      bg="bg"
    >
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="semibold" mt={1}>
        {value}
      </Text>
      {hint ? (
        <Text fontSize="xs" color="fg.muted" mt={1}>
          {hint}
        </Text>
      ) : null}
    </Box>
  )
}

function ItemsChart({ series }: { series: DashboardStats["series"] }) {
  const max = Math.max(1, ...series.map((point) => point.items))

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="md"
      p={4}
      bg="bg"
    >
      <Heading size="sm" mb={4}>
        Items created (last 7 days)
      </Heading>
      <Flex align="flex-end" gap={3} h="180px">
        {series.map((point) => {
          const heightPct = Math.round((point.items / max) * 100)
          const label = point.date.slice(5) // MM-DD
          return (
            <Flex
              key={point.date}
              direction="column"
              align="center"
              justify="flex-end"
              flex="1"
              h="100%"
              gap={2}
            >
              <Text fontSize="xs" color="fg.muted">
                {point.items}
              </Text>
              <Box
                w="100%"
                maxW="48px"
                bg="teal.500"
                borderTopRadius="sm"
                h={`${Math.max(heightPct, point.items > 0 ? 8 : 2)}%`}
                minH="2px"
                title={`${point.date}: ${point.items}`}
              />
              <Text fontSize="xs" color="fg.muted">
                {label}
              </Text>
            </Flex>
          )
        })}
      </Flex>
    </Box>
  )
}

function Dashboard() {
  const { user: currentUser } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  })

  return (
    <Container maxW="full">
      <Box pt={8} m={4}>
        <Text fontSize="2xl" truncate maxW="lg">
          Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
        </Text>
        <Text color="fg.muted" mb={8}>
          Welcome back — here is a snapshot of the app.
        </Text>

        {isLoading ? (
          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" }}
            gap={4}
            mb={6}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} height="110px" borderRadius="md" />
            ))}
          </Grid>
        ) : null}

        {isError ? (
          <Text color="red.500" mb={4}>
            Could not load dashboard stats.
          </Text>
        ) : null}

        {data ? (
          <>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(3, 1fr)",
                xl: "repeat(5, 1fr)",
              }}
              gap={4}
              mb={6}
            >
              <StatCard label="Users" value={data.users} />
              <StatCard label="Items" value={data.items} />
              <StatCard
                label="Avatars"
                value={data.avatars}
                hint="Users with an avatar set"
              />
              <StatCard
                label="Jobs pending"
                value={data.jobs_pending}
                hint="SQS approximate depth"
              />
              <StatCard
                label="API / file-service"
                value={data.api_healthy ? "OK" : "Degraded"}
                hint={
                  data.jobs_failed
                    ? `Failed jobs: ${data.jobs_failed}`
                    : "Health probe"
                }
              />
            </Grid>
            <ItemsChart series={data.series} />
          </>
        ) : null}
      </Box>
    </Container>
  )
}
